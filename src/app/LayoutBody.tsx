"use client";

import { usePathname } from "next/navigation";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { NotificationsProvider } from "../hooks/useNotifications";
import { isSupabaseConfigured } from "../lib/supabase";
import Link from "next/link";

export default function LayoutBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isSupabaseConfigured && (
        <div className="bg-amber-100 text-amber-800 py-2 px-3 md:px-4 text-center text-xs md:text-sm font-medium break-words">
          تنبيه: قاعدة البيانات (Supabase) غير متصلة. يرجى توفير المتغيرات NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY.
          <Link href="/setup" className="underline mr-2 text-amber-900">طريقة الإعداد</Link>
        </div>
      )}
      <NotificationsProvider>
        {!isAdminPage && <Navbar />}
        <main className="flex-grow w-full overflow-x-hidden">
          {children}
        </main>
        {!isAdminPage && <Footer />}
      </NotificationsProvider>
    </div>
  );
}
