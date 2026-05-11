import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis, isRedisConfigured } from '@/lib/redis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const checks: Record<string, 'ok' | 'error' | 'skipped'> = {};
  const errors: string[] = [];
  const startTime = Date.now();

  // 1. Database check
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase
      .from('platform_settings')
      .select('site_name')
      .limit(1);

    if (error) {
      checks.database = 'error';
      errors.push(`Database: ${error.message}`);
    } else {
      checks.database = 'ok';
    }
  } catch (e: any) {
    checks.database = 'error';
    errors.push(`Database: ${e.message}`);
  }

  // 2. Redis check
  if (isRedisConfigured && redis) {
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch (e: any) {
      checks.redis = 'error';
      errors.push(`Redis: ${e.message}`);
    }
  } else {
    checks.redis = 'skipped';
  }

  const responseTime = Date.now() - startTime;
  const healthy = checks.database === 'ok' && (checks.redis !== 'error');

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      checks,
      errors: errors.length > 0 ? errors : undefined,
    },
    { status: healthy ? 200 : 503 }
  );
}
