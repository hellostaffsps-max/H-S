import { describe, it, expect, vi } from 'vitest';

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    url: string;
    token: string;
    constructor({ url, token }: { url: string; token: string }) {
      if (!url || !token) throw new Error('Missing credentials');
      this.url = url;
      this.token = token;
    }
  },
}));

describe('redis module', () => {
  it('exports isRedisConfigured as false when env vars are missing', async () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    vi.resetModules();
    const { isRedisConfigured } = await import('./redis');
    expect(isRedisConfigured).toBe(false);

    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it('exports isRedisConfigured as true when env vars are present', async () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

    vi.resetModules();
    const { isRedisConfigured } = await import('./redis');
    expect(isRedisConfigured).toBe(true);

    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });
});
