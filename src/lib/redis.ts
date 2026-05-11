import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for production rate limiting.
 * Falls back to null if credentials are missing or invalid.
 */
function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, '');

  if (!url || !token) return null;
  if (!url.startsWith('https://')) {
    console.warn('[Redis] Invalid URL (must start with https):', url);
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (error) {
    console.warn('[Redis] Failed to create client:', error);
    return null;
  }
}

export const redis = createRedisClient();
export const isRedisConfigured = !!redis;
