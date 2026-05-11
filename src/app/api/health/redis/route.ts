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
    const testKey = `healthcheck:${Date.now()}`;
    await redis.set(testKey, Date.now());
    const value = await redis.get(testKey);
    await redis.del(testKey);
    const latency = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      message: 'Redis connection successful',
      latency_ms: latency,
      value_received: value !== null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Health Check] Redis error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Redis connection failed',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
