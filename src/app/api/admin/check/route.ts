import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  const auth = await verifyAdmin();

  return NextResponse.json({
    success: auth.isAdmin,
    isAdmin: auth.isAdmin,
    isSuperAdmin: auth.isSuperAdmin,
    permissions: auth.permissions,
    user: auth.user,
    profile: auth.profile,
  });
}
