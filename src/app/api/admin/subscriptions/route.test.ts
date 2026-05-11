import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/admin-auth', () => ({
  verifyAdmin: vi.fn(),
  adminGuard: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(),
}));

import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';

describe('GET /api/admin/subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated subscriptions for admin', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: { id: 'admin-1' }, profile: { role: 'admin' },
      permissions: [], isAdmin: true, isSuperAdmin: true,
    });
    vi.mocked(adminGuard).mockReturnValue(null);

    const mockData = [
      { id: 'sub-1', status: 'active', profiles: { full_name: 'User 1' }, subscription_plans: { name: 'Basic' } },
    ];

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'user_subscriptions') {
          return {
            select: vi.fn().mockImplementation((cols: string, opts?: any) => {
              if (opts?.count === 'exact') {
                return Promise.resolve({ count: 5, error: null });
              }
              return {
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({ data: mockData, error: null }),
                }),
              };
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new Request('http://localhost/api/admin/subscriptions?page=1&limit=10');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(5);
  });

  it('returns 401 for non-admin', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: null, profile: null, permissions: [],
      isAdmin: false, isSuperAdmin: false, error: 'Unauthorized',
    });
    vi.mocked(adminGuard).mockReturnValue(
      new Response(JSON.stringify({ success: false }), { status: 401 })
    );

    const request = new Request('http://localhost/api/admin/subscriptions');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });
});
