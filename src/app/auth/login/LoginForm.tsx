"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ChefHat, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

interface LoginFormProps {
  redirect?: string;
}

export default function LoginForm({ redirect = "/dashboard" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
      setLoading(false);
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
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "فشل إرسال رابط إعادة التعيين");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-200"
        >
          <ChefHat className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-brand-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          ليس لديك حساب؈{" "}
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
