import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';

vi.mock('@/lib/admin-auth', () => ({
  verifyAdmin: vi.fn(),
  adminGuard: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(),
}));

import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';

describe('GET /api/admin/articles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated as admin', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: null, profile: null, permissions: [], isAdmin: false, isSuperAdmin: false, error: 'Unauthorized',
    });
    vi.mocked(adminGuard).mockReturnValue(
      new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 })
    );

    const request = new Request('http://localhost/api/admin/articles');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('returns paginated articles list', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com' },
      profile: { role: 'admin', full_name: 'Admin' },
      permissions: [], isAdmin: true, isSuperAdmin: true,
    });
    vi.mocked(adminGuard).mockReturnValue(null);

    const mockData = [
      { id: '1', title: 'Article 1', profiles: { full_name: 'Author 1' } },
      { id: '2', title: 'Article 2', profiles: { full_name: 'Author 2' } },
    ];

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'articles') {
          return {
            select: vi.fn().mockImplementation((cols: string, opts?: any) => {
              if (opts?.count === 'exact') {
                return Promise.resolve({ count: 10, error: null });
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

    const request = new Request('http://localhost/api/admin/articles?page=1&limit=10');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.pagination).toBeDefined();
    expect(json.pagination.limit).toBe(10);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: { id: 'admin-1' }, profile: { role: 'admin' },
      permissions: [], isAdmin: true, isSuperAdmin: true,
    });
    vi.mocked(adminGuard).mockReturnValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
          }),
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new Request('http://localhost/api/admin/articles');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});

describe('POST /api/admin/articles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates article with valid data', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com' },
      profile: { role: 'admin' }, permissions: [], isAdmin: true, isSuperAdmin: true,
    });
    vi.mocked(adminGuard).mockReturnValue(null);

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'articles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'new-id', title: 'Test Article' }, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new Request('http://localhost/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Article', content: 'Test content', excerpt: 'Test excerpt' }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.title).toBe('Test Article');
  });

  it('returns 400 when title is missing', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: { id: 'admin-1' }, profile: { role: 'admin' },
      permissions: [], isAdmin: true, isSuperAdmin: true,
    });
    vi.mocked(adminGuard).mockReturnValue(null);

    const request = new Request('http://localhost/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify({ content: 'No title' }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Title and content are required');
  });

  it('returns 400 for invalid JSON', async () => {
    vi.mocked(verifyAdmin).mockResolvedValue({
      user: { id: 'admin-1' }, profile: { role: 'admin' },
      permissions: [], isAdmin: true, isSuperAdmin: true,
    });
    vi.mocked(adminGuard).mockReturnValue(null);

    const request = new Request('http://localhost/api/admin/articles', {
      method: 'POST',
      body: 'not-json',
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid JSON body');
  });
});
