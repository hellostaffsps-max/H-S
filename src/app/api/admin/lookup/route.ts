import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Securely lookup admin user by username or email.
 * Returns the email only if the user exists AND is an admin.
 * Otherwise returns a generic error to prevent enumeration.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 attempts per 15 minutes per IP
  const rateLimitResult = await checkRateLimit('admin_lookup', 10, 15 * 60 * 1000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'لقد تجاوزت الحد المسموح من المحاولات، يرجى الانتظار 15 دقيقة' },
      { status: 429 }
    );
  }

  try {
    const { input } = await request.json();
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صالحة' },
        { status: 400 }
      );
    }

    const trimmed = input.trim().toLowerCase();
    const supabase = createAdminClient();

    let profile: { email: string | null; role: string } | null = null;

    if (trimmed.includes('@')) {
      // Search by email
      const { data, error } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('email', trimmed)
        .single();

      if (!error && data) profile = data;
    } else {
      // Search by username
      const { data, error } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('username', trimmed)
        .single();

      if (!error && data) profile = data;
    }

    // Generic error for ALL failures — prevents email/username enumeration
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      email: profile.email || `${trimmed}@admin.local`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
      { status: 500 }
    );
  }
}
