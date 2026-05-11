import { Ratelimit } from '@upstash/ratelimit';
import { redis, isRedisConfigured } from './redis';
import { headers } from 'next/headers';

/**
 * Production-ready rate limiting with Upstash Redis.
 * Falls back to in-memory limiting when Redis is not configured (dev).
 */

// ── In-memory fallback (for dev / when Redis is missing) ─────────────────
const MAX_MAP_SIZE = 10_000;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = Date.now();

function lazyCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(key);
  }
}

function evictIfNeeded() {
  if (rateLimitMap.size <= MAX_MAP_SIZE) return;
  const toDelete = Math.ceil(rateLimitMap.size * 0.2);
  let deleted = 0;
  for (const key of rateLimitMap.keys()) {
    if (deleted >= toDelete) break;
    rateLimitMap.delete(key);
    deleted++;
  }
}

async function getClientIP(): Promise<string> {
  try {
    const headersList = await headers();
    return (
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'
    );
  } catch {
    return 'unknown';
  }
}

// ── Upstash Redis rate limiter ──────────────────────────────────────────
function createUpstashLimiter(action: string, limit: number, windowMs: number) {
  if (!redis) return null;

  // Upstash Ratelimit uses sliding window by default
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
    prefix: `ratelimit:${action}`,
    analytics: false, // disable to reduce Redis ops
  });
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  reset?: number;
}

/**
 * Check rate limit for a given action.
 * Uses Upstash Redis in production; falls back to in-memory in dev.
 * @param action   - Name of the action (e.g., 'contact', 'sendMessage')
 * @param limit    - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @param userId   - Optional authenticated user ID for more accurate limiting
 */
export async function checkRateLimit(
  action: string,
  limit: number,
  windowMs: number,
  userId?: string
): Promise<RateLimitResult> {
  const identifier = userId || (await getClientIP());
  const key = `${action}:${identifier}`;

  // Try Upstash first
  const upstash = createUpstashLimiter(action, limit, windowMs);
  if (upstash) {
    const { success, remaining, reset } = await upstash.limit(key);
    return { success, remaining, limit, reset };
  }

  // ── In-memory fallback ──────────────────────────────────────────────
  lazyCleanup();

  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    evictIfNeeded();
    return { success: true, remaining: limit - 1, limit };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, limit };
  }

  record.count++;
  return { success: true, remaining: limit - record.count, limit };
}
