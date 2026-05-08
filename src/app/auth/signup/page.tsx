"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Mail, User, AlertCircle, Loader2, Building2, Search, CheckCircle } from 'lucide-react';

function SignupForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'employer' || roleParam === 'seeker') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    const result = await signUp(email, password, role, fullName);

    if (result.success) {
      // If no session returned, email confirmation is required
      if (!result.session) {
        setNeedsConfirmation(true);
        setLoading(false);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(result.error || 'حدث خطأ أثناء إنشاء الحساب');
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">تم إنشاء حسابك!</h2>
          <p className="text-slate-500 text-sm mb-4">
            أرسلنا رابط التفعيل إلى بريدك الإلكتروني
          </p>
          <p className="text-slate-600 text-sm font-medium bg-slate-50 p-3 rounded-xl mb-6">
            {email}
          </p>
          <p className="text-xs text-slate-400 mb-6">
            اضغط على الرابط في البريد لتفعيل حسابك، ثم سجّل الدخول.
          </p>
          <Link
            href="/auth/login"
            className="inline-block w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors"
          >
            الذهاب لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center mb-4">
          <Image src="/logo.png" alt="Hello Staff" width={56} height={56} />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">إنشاء حساب جديد</h1>
        <p className="text-slate-500 mt-2">انضم إلى أكبر منصة توظيف في قطاع الضيافة</p>
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">نوع الحساب</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('seeker')}
                className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-2xl border-2 transition-all ${
                  role === 'seeker'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Search className="h-4 w-4" />
                <span className="font-bold text-xs sm:text-sm">باحث عن عمل</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all ${
                  role === 'employer'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span className="font-bold text-sm">صاحب عمل</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">الاسم الكامل</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pr-12 pl-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                placeholder={role === 'employer' ? 'اسم الشركة أو المطعم' : 'الاسم الثلاثي'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
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
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-brand-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'إنشاء الحساب'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          لديك حساب بالفعل؟{' '}
          <Link href="/auth/login" className="text-brand-600 font-bold hover:underline">
            سجل دخولك
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <Suspense fallback={
        <div className="max-w-md w-full text-center">
          <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  );
}
