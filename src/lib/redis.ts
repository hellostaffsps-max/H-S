import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for production rate limiting.
 * Falls back to null if credentials are missing (dev environments).
 */
export const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export const isRedisConfigured = !!redis;
