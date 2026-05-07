import { headers } from 'next/headers';

/**
 * Simple in-memory rate limiter for server actions.
 * Works per serverless instance lifetime.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
 * @param action - Name of the action (e.g., 'contact', 'sendMessage')
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Whether the request is allowed
 */
export async function checkRateLimit(
  action: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const ip = await getClientIP();
  const key = `${action}:${ip}`;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}
