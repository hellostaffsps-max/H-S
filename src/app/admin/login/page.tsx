"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ChefHat, Lock, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Turnstile } from '@marsidev/react-turnstile';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const input = username.trim().toLowerCase();
      let emailToLogin: string | null = null;

      if (input.includes('@')) {
        // User entered an email address — look up profile by email
        const { data: profile, error: lookupError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('email', input)
          .single();

        if (lookupError || !profile) {
          // Fallback: try direct auth login (for accounts created directly in Supabase Auth)
          const { error: directLoginError } = await supabase.auth.signInWithPassword({
            email: input,
            password,
            options: {
              captchaToken: captchaToken || undefined,
            }
          });
          if (directLoginError) throw new Error(directLoginError.message);

          // After direct login, verify admin role
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');

          const { data: postLoginProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (postLoginProfile?.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('غير مصرح لك بالدخول إلى لوحة الإدارة');
          }

          router.push('/admin');
          return;
        }

        if (profile.role !== 'admin') {
          throw new Error('غير مصرح لك بالدخول إلى لوحة الإدارة');
        }

        emailToLogin = profile.email;
      } else {
        // User entered a username — look up by username
        const { data: profile, error: lookupError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('username', input)
          .single();

        if (lookupError || !profile) {
          throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
        }

        if (profile.role !== 'admin') {
          throw new Error('غير مصرح لك بالدخول إلى لوحة الإدارة');
        }

        emailToLogin = profile.email || `${input}@admin.local`;
      }

      // Sign in with the resolved email
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToLogin!,
        password,
        options: {
          captchaToken: captchaToken || undefined,
        }
      });

      if (loginError) throw new Error(loginError.message);

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
      setLoading(false);
      setCaptchaToken(null);
      setTurnstileKey(prev => prev + 1);
    }
  };

  const handleResetPassword = async () => {
    if (!username) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني أولاً');
      return;
    }
    setResetLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const input = username.trim().toLowerCase();
      let targetEmail: string | null = null;

      if (input.includes('@')) {
        // User entered an email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', input)
          .single();
        targetEmail = profile?.email || input;
      } else {
        // User entered a username
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', input)
          .single();
        targetEmail = profile?.email || null;
      }

      if (!targetEmail) {
        throw new Error('لم يتم العثور على حساب بهذا الاسم');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/admin/login`,
        captchaToken: captchaToken || undefined,
      });
      if (error) throw error;
      setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد المرتبط');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين');
      setCaptchaToken(null);
      setTurnstileKey(prev => prev + 1);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Hello Staff" width={64} height={64} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">لوحة الإدارة العليا</h1>
          <p className="text-slate-500 mt-2">مرحباً بك مجدداً، يرجى تسجيل الدخول للمتابعة</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-700 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                  placeholder="admin أو email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex justify-center py-2">
              <Turnstile 
                key={turnstileKey}
                siteKey="0x4AAAAAADO2aIuCx4SlQRvd" 
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'تسجيل الدخول'
              )}
            </button>

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="w-full text-brand-600 font-bold text-sm hover:text-brand-700 transition-colors disabled:opacity-50"
            >
              {resetLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </span>
              ) : (
                'نسيت كلمة المرور؟'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-8">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} Hello Staff
        </p>
      </div>
    </div>
  );
}
