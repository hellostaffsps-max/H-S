import { describe, it, expect, vi } from 'vitest';

// Mock the ssr module before importing
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockImplementation((url, key, options) => {
    return {
      auth: {},
      from: vi.fn(),
      // Store options for inspection
      _options: options,
    };
  }),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([
      { name: 'sb-access-token', value: 'test-token' },
    ]),
    set: vi.fn(),
    get: vi.fn(),
  }),
}));

import { createServerClient } from '@supabase/ssr';
import { createClient } from './supabase-server';

describe('createClient', () => {
  it('creates a server client with cookie handlers', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    const client = await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  it('handles getAll cookies', async () => {
    const client = await createClient();
    const options = vi.mocked(createServerClient).mock.calls[0][2];
    const cookies = options.cookies.getAll();
    expect(cookies).toEqual([{ name: 'sb-access-token', value: 'test-token' }]);
  });

  it('handles setAll cookies without throwing', async () => {
    const client = await createClient();
    const options = vi.mocked(createServerClient).mock.calls[0][2];

    // Should not throw even if cookieStore.set fails
    expect(() => {
      options.cookies.setAll([
        { name: 'test', value: 'value', options: {} },
      ]);
    }).not.toThrow();
  });
});
