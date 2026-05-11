import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers before importing module
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '192.168.1.1';
      if (name === 'x-real-ip') return '10.0.0.1';
      return null;
    }),
  }),
}));

// Mock Redis / Ratelimit
const mockLimit = vi.fn();
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: {
    slidingWindow: vi.fn().mockReturnValue('sliding-window-config'),
  },
}));

vi.mock('./redis', () => ({
  redis: null, // Force in-memory fallback for tests
  isRedisConfigured: false,
}));

// Need to import after mocks
import { checkRateLimit } from './rate-limit';

describe('checkRateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows first request within limit', async () => {
    const result = await checkRateLimit('test-action', 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
  });

  it('blocks request after limit is exceeded', async () => {
    const action = 'test-block';
    const limit = 2;

    await checkRateLimit(action, limit, 60_000);
    await checkRateLimit(action, limit, 60_000);
    const third = await checkRateLimit(action, limit, 60_000);

    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('resets limit after window expires', async () => {
    const action = 'test-reset';
    const windowMs = 60_000;

    await checkRateLimit(action, 1, windowMs);
    const blocked = await checkRateLimit(action, 1, windowMs);
    expect(blocked.success).toBe(false);

    // Advance time past window
    vi.advanceTimersByTime(windowMs + 1);

    const reset = await checkRateLimit(action, 1, windowMs);
    expect(reset.success).toBe(true);
  });

  it('uses userId when provided instead of IP', async () => {
    const userId = 'user-123';
    const action = 'test-user';

    // First 3 requests from same user
    const r1 = await checkRateLimit(action, 2, 60_000, userId);
    const r2 = await checkRateLimit(action, 2, 60_000, userId);
    const r3 = await checkRateLimit(action, 2, 60_000, userId);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(false);
  });

  it('treats different actions independently', async () => {
    await checkRateLimit('action-a', 1, 60_000);
    await checkRateLimit('action-a', 1, 60_000);

    const otherAction = await checkRateLimit('action-b', 1, 60_000);
    expect(otherAction.success).toBe(true);
  });

  it('returns correct remaining count', async () => {
    const action = 'test-remaining';
    const limit = 10;

    const r1 = await checkRateLimit(action, limit, 60_000);
    expect(r1.remaining).toBe(9);

    const r2 = await checkRateLimit(action, limit, 60_000);
    expect(r2.remaining).toBe(8);
  });
});
