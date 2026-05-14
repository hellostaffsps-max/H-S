"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

interface LoginFormProps {
  redirect?: string;
}

export default function LoginForm({ redirect = "/dashboard" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [user, authLoading, router, redirect]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined,
        }
      });

      if (loginError) throw loginError;
      window.location.href = redirect;
    } catch (err: any) {
      // Use a generic error message for all login failures to prevent email enumeration (Fix 6)
      setError("بيانات الدخول غير صحيحة، أو لم تقم بتفعيل حسابك بعد.");
      setLoading(false);
      setCaptchaToken(null);
      setTurnstileKey(prev => prev + 1);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("أدخل بريدك الإلكتروني أولاً ثم اضغط نسيت كلمة المرور");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
        captchaToken: captchaToken || undefined,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "فشل إرسال رابط إعادة التعيين");
      setCaptchaToken(null);
      setTurnstileKey(prev => prev + 1);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center mb-4"
        >
          <Image src="/logo.png" alt="Hello Staff" width={56} height={56} />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          تسجيل الدخول
        </h1>
        <p className="text-slate-500 mt-2">مرحباً بك مجدداً في Hello Staff</p>
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
        {resetSent && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-700 text-sm">
            <span className="text-lg">✉️</span>
            <p>تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-12 pl-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 mr-1">
              <label className="block text-sm font-bold text-slate-700">
                كلمة المرور
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-brand-600 font-bold hover:underline"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
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
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-brand-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>

        <div className="relative mt-8 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-slate-500 font-medium">أو</span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
              if (error) throw error;
            } catch (err: any) {
              setError(err.message || "حدث خطأ أثناء تسجيل الدخول بواسطة Google");
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 sm:py-4 rounded-2xl shadow-sm border border-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          المتابعة باستخدام Google
        </button>

        <div className="mt-6 text-center text-sm text-slate-500">
          ليس لديك حساب؟{" "}
          <Link
            href="/auth/signup"
            className="text-brand-600 font-bold hover:underline"
          >
            سجل الآن
          </Link>
        </div>
      </div>
    </div>
  );
}
