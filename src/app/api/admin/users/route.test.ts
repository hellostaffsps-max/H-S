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

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated users for admin', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: { id: 'admin-1' }, profile: { role: 'admin' },
      permissions: [], isAdmin: true, isSuperAdmin: true,
    });
    vi.mocked(adminGuard).mockReturnValue(null);

    const mockUsers = [
      { id: 'user-1', full_name: 'Alice', role: 'seeker' },
      { id: 'user-2', full_name: 'Bob', role: 'employer' },
    ];

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation((cols: string, opts?: any) => {
              if (opts?.count === 'exact') {
                return Promise.resolve({ count: 100, error: null });
              }
              return {
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
                }),
              };
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new Request('http://localhost/api/admin/users?page=1&limit=50');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.pagination.limit).toBe(50);
    expect(json.pagination.total).toBe(100);
    expect(json.pagination.totalPages).toBe(2);
  });
});
