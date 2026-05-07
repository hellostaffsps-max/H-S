import { Suspense } from "react";
import LoginForm from "./LoginForm";

function LoginSkeleton() {
  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-slate-100 rounded-2xl mb-4 w-16 h-16 animate-pulse"></div>
        <div className="h-8 sm:h-10 bg-slate-100 rounded-lg w-40 mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 bg-slate-100 rounded w-56 mx-auto animate-pulse"></div>
      </div>
      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 space-y-5">
        <div>
          <div className="h-4 bg-slate-100 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-12 bg-slate-50 rounded-2xl animate-pulse"></div>
        </div>
        <div>
          <div className="h-4 bg-slate-100 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-12 bg-slate-50 rounded-2xl animate-pulse"></div>
        </div>
        <div className="h-14 bg-slate-100 rounded-2xl animate-pulse"></div>
      </div>
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const redirect = typeof searchParams?.redirect === "string" ? searchParams.redirect : "/dashboard";

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans"
      dir="rtl"
    >
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm redirect={redirect} />
      </Suspense>
    </div>
  );
}
