import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export type AppRole = 'employer' | 'seeker' | 'admin';

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) setProfile(data as Profile);
    } catch (e: any) {
      console.error('Error fetching profile:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, role: AppRole, fullName: string) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Use upsert to avoid duplicate key errors if profile already exists
        // (e.g., user already signed up, or a DB trigger created it)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            role,
            full_name: fullName,
          }, { onConflict: 'id' });

        if (profileError) throw profileError;

        if (role === 'employer') {
          await supabase
            .from('employers')
            .upsert({ profile_id: data.user.id, company_name: fullName }, { onConflict: 'profile_id' });
        } else if (role === 'seeker') {
          await supabase
            .from('seekers')
            .upsert({ profile_id: data.user.id, job_title: '' }, { onConflict: 'profile_id' });
        }
      }

      return { success: true, session: data.session };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) await fetchProfile(data.user.id);
      return { success: true };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    }
  };

  return { user, profile, loading, error, signUp, signIn, signOut };
}
