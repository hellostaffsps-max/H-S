import { NextResponse } from 'next/server';
import { redis, isRedisConfigured } from '@/lib/redis';

export async function GET() {
  if (!isRedisConfigured || !redis) {
    return NextResponse.json(
      { status: 'warning', message: 'Redis not configured. Using in-memory fallback.' },
      { status: 200 }
    );
  }

  try {
    const start = Date.now();
    await redis.set('healthcheck', Date.now());
    const value = await redis.get('healthcheck');
    const latency = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      message: 'Redis connection successful',
      latency_ms: latency,
      value_received: value,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Redis connection failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
