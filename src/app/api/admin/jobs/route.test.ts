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

describe('GET /api/admin/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated jobs for admin', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: { id: 'admin-1' },
      profile: { role: 'admin' },
      permissions: [],
      isAdmin: true,
      isSuperAdmin: true,
    });
    vi.mocked(adminGuard).mockReturnValue(null);

    const mockJobs = [
      { id: '1', title: 'Chef', employers: { company_name: 'Hotel A' } },
      { id: '2', title: 'Waiter', employers: { company_name: 'Cafe B' } },
    ];

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            select: vi.fn().mockImplementation((cols: string, opts?: any) => {
              if (opts?.count === 'exact') {
                return Promise.resolve({ count: 25, error: null });
              }
              return {
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
                }),
              };
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new Request('http://localhost/api/admin/jobs?page=2&limit=10');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.total).toBe(25);
    expect(json.pagination.totalPages).toBe(3);
    expect(json.pagination.hasNext).toBe(true);
    expect(json.pagination.hasPrev).toBe(true);
  });

  it('returns 401 for non-admin', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: null,
      profile: null,
      permissions: [],
      isAdmin: false,
      isSuperAdmin: false,
      error: 'Unauthorized',
    });
    vi.mocked(adminGuard).mockReturnValue(
      new Response(JSON.stringify({ success: false }), { status: 401 })
    );

    const request = new Request('http://localhost/api/admin/jobs');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });
});
