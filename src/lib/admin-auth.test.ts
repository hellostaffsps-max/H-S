import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock supabase-server
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockAuthGetUser = vi.fn();

vi.mock('./supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockAuthGetUser() },
    from: (table: string) => {
      mockFrom(table);
      return {
        select: (cols: string) => {
          mockSelect(cols);
          return {
            eq: (col: string, val: unknown) => {
              mockEq(col, val);
              return { single: () => mockSingle() };
            },
          };
        },
      };
    },
  }),
}));

import { verifyAdmin, adminGuard, type AdminAuthResult } from './admin-auth';

describe('verifyAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized when no user is logged in', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const result = await verifyAdmin();

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns profile not found when profile query fails', async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null, error: new Error('Not found') });

    const result = await verifyAdmin();

    expect(result.isAdmin).toBe(false);
    expect(result.error).toBe('Profile not found');
  });

  it('returns forbidden when user role is not admin', async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { role: 'seeker', full_name: 'Test User', admin_role_id: null },
      error: null,
    });

    const result = await verifyAdmin();

    expect(result.isAdmin).toBe(false);
    expect(result.error).toContain('Forbidden');
  });

  it('returns superAdmin when admin_role_id is null', async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { role: 'admin', full_name: 'Admin User', admin_role_id: null },
      error: null,
    });

    const result = await verifyAdmin();

    expect(result.isAdmin).toBe(true);
    expect(result.isSuperAdmin).toBe(true);
    expect(result.permissions).toEqual([]);
  });

  it('fetches permissions for non-super admin', async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { role: 'admin', full_name: 'Moderator', admin_role_id: 'role-1' },
      error: null,
    });

    // Second query for permissions
    const mockRolePermsSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        then: (cb: Function) =>
          cb({ data: [{ permission_id: 'perm-1' }, { permission_id: 'perm-2' }], error: null }),
      }),
    });

    const { createClient } = await import('./supabase-server');
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: () => mockAuthGetUser() },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({ single: () => mockSingle() }),
            }),
          };
        }
        if (table === 'admin_role_permissions') {
          return {
            select: mockRolePermsSelect,
          };
        }
        return {};
      }),
    } as any);

    const result = await verifyAdmin();

    expect(result.isAdmin).toBe(true);
    expect(result.isSuperAdmin).toBe(false);
  });
});

describe('adminGuard', () => {
  it('returns 401 response when not admin', () => {
    const result: AdminAuthResult = {
      user: null,
      profile: null,
      permissions: [],
      isAdmin: false,
      isSuperAdmin: false,
      error: 'Unauthorized',
    };

    const guard = adminGuard(result);
    expect(guard).toBeInstanceOf(NextResponse);
    expect(guard?.status).toBe(401);
  });

  it('returns 403 response when forbidden', () => {
    const result: AdminAuthResult = {
      user: { id: 'user-1' },
      profile: { role: 'seeker' },
      permissions: [],
      isAdmin: false,
      isSuperAdmin: false,
      error: 'Forbidden: Admin role required',
    };

    const guard = adminGuard(result);
    expect(guard).toBeInstanceOf(NextResponse);
    expect(guard?.status).toBe(403);
  });

  it('returns null when admin is valid', () => {
    const result: AdminAuthResult = {
      user: { id: 'user-1' },
      profile: { role: 'admin' },
      permissions: [],
      isAdmin: true,
      isSuperAdmin: true,
    };

    const guard = adminGuard(result);
    expect(guard).toBeNull();
  });

  it('returns 403 when permission is required but missing', () => {
    const result: AdminAuthResult = {
      user: { id: 'user-1' },
      profile: { role: 'admin', admin_role_id: 'role-1' },
      permissions: ['perm-a'],
      isAdmin: true,
      isSuperAdmin: false,
    };

    const guard = adminGuard(result, 'perm-b');
    expect(guard).toBeInstanceOf(NextResponse);
    expect(guard?.status).toBe(403);
  });

  it('returns null when required permission exists', () => {
    const result: AdminAuthResult = {
      user: { id: 'user-1' },
      profile: { role: 'admin', admin_role_id: 'role-1' },
      permissions: ['perm-a'],
      isAdmin: true,
      isSuperAdmin: false,
    };

    const guard = adminGuard(result, 'perm-a');
    expect(guard).toBeNull();
  });

  it('allows any permission for super admin', () => {
    const result: AdminAuthResult = {
      user: { id: 'user-1' },
      profile: { role: 'admin' },
      permissions: [],
      isAdmin: true,
      isSuperAdmin: true,
    };

    const guard = adminGuard(result, 'any-perm');
    expect(guard).toBeNull();
  });
});
