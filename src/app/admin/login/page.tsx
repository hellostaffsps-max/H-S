"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ChefHat, Lock, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      // Look up the email associated with this username
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('username', username.trim())
        .single();

      if (lookupError || !profile) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }

      if (profile.role !== 'admin') {
        throw new Error('غير مصرح لك بالدخول إلى لوحة الإدارة');
      }

      // Sign in with the associated email
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: profile.email || `${username.trim()}@admin.local`,
        password,
      });

      if (loginError) throw loginError;

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!username) {
      setError('يرجى إدخال اسم المستخدم أولاً');
      return;
    }
    setResetLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Look up email for this username
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username.trim())
        .single();

      if (!profile?.email) {
        throw new Error('لم يتم العثور على حساب بهذا الاسم');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/admin/login`,
      });
      if (error) throw error;
      setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد المرتبط');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين');
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
                اسم المستخدم
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
                  placeholder="admin"
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

            <button
              type="submit"
              disabled={loading}
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
