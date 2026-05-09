import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Sanitize next param to prevent open redirect
  let redirectTo = '/';
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    redirectTo = next;
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && session) {
      const role = searchParams.get('role');
      if (role === 'employer') {
        const userId = session.user.id;
        
        // 1. Update profile role
        await supabase.from('profiles').update({ role: 'employer' }).eq('id', userId);
        
        // 2. Insert into employers table
        const fullName = session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.name || 
                         session.user.email?.split('@')[0] || '';
                         
        await supabase.from('employers').upsert({
          profile_id: userId,
          company_name: fullName
        });
        
        // 3. Delete from seekers table if the trigger created it
        await supabase.from('seekers').delete().eq('profile_id', userId);
      }
      
      const finalRedirect = role === 'employer' ? '/pricing' : redirectTo;
      return NextResponse.redirect(`${origin}${finalRedirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
}
