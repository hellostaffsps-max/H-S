import { headers } from 'next/headers';

/**
 * Improved in-memory rate limiter for server actions.
 *
 * Improvements over the previous version:
 * 1. Lazy cleanup — expired entries are pruned on every call instead of via
 *    setInterval (which can leak in serverless environments).
 * 2. Max map size cap (10,000 entries) to prevent unbounded memory growth.
 * 3. Supports optional userId for more accurate limiting when the user is
 *    authenticated (falls back to IP when not provided).
 */

const MAX_MAP_SIZE = 10_000;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = Date.now();

/**
 * Remove all expired entries from the map.
 * Called lazily — at most once every 60 seconds — to keep overhead minimal.
 */
function lazyCleanup() {
  const now = Date.now();
  // Only run cleanup at most once per minute
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Emergency eviction: if the map exceeds MAX_MAP_SIZE, drop the oldest
 * entries to keep memory bounded.
 */
function evictIfNeeded() {
  if (rateLimitMap.size <= MAX_MAP_SIZE) return;

  // Delete the oldest 20% of entries
  const toDelete = Math.ceil(rateLimitMap.size * 0.2);
  let deleted = 0;
  for (const key of rateLimitMap.keys()) {
    if (deleted >= toDelete) break;
    rateLimitMap.delete(key);
    deleted++;
  }
}

/**
 * Get client IP from request headers.
 */
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

export interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/**
 * Check rate limit for a given action.
 * @param action   - Name of the action (e.g., 'contact', 'sendMessage')
 * @param limit    - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @param userId   - Optional authenticated user ID for more accurate limiting
 * @returns Whether the request is allowed
 */
export async function checkRateLimit(
  action: string,
  limit: number,
  windowMs: number,
  userId?: string
): Promise<RateLimitResult> {
  // Run lazy cleanup first
  lazyCleanup();

  const identifier = userId || (await getClientIP());
  const key = `${action}:${identifier}`;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    evictIfNeeded();
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}
