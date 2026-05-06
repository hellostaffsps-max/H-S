import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export interface AdminAuthResult {
  user: { id: string; email?: string } | null;
  profile: { role: string; full_name?: string } | null;
  isAdmin: boolean;
  error?: string;
}

export async function verifyAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, profile: null, isAdmin: false, error: 'Unauthorized' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { user: null, profile: null, isAdmin: false, error: 'Profile not found' };
    }

    if (profile.role !== 'admin') {
      return { user, profile, isAdmin: false, error: 'Forbidden: Admin role required' };
    }

    return { user, profile, isAdmin: true };
  } catch {
    return { user: null, profile: null, isAdmin: false, error: 'Internal error' };
  }
}

export function adminGuard(result: AdminAuthResult): NextResponse | null {
  if (!result.isAdmin) {
    return NextResponse.json(
      { success: false, error: result.error || 'Unauthorized' },
      { status: result.error?.includes('Forbidden') ? 403 : 401 }
    );
  }
  return null;
}
