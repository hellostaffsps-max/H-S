"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCircle,
  Briefcase,
  ClipboardList,
  CreditCard,
  Receipt,
  Layers,
  FileText,
  Megaphone,
  Flag,
  BarChart3,
  Settings,
  ShieldCheck,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import NotificationsDropdown from "@/components/NotificationsDropdown";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "نظرة عامة", href: "/admin", icon: LayoutDashboard },
  { label: "إدارة المستخدمين", href: "/admin/users", icon: Users },
  { label: "أصحاب العمل", href: "/admin/employers", icon: Building2 },
  { label: "المرشحون", href: "/admin/candidates", icon: UserCircle },
  { label: "الوظائف", href: "/admin/jobs", icon: Briefcase },
  { label: "طلبات التوظيف", href: "/admin/applications", icon: ClipboardList },
  { label: "الاشتراكات", href: "/admin/subscriptions", icon: CreditCard },
  { label: "الدفع والفواتير", href: "/admin/payments", icon: Receipt },
  { label: "الباقات", href: "/admin/plans", icon: Layers },
  { label: "المقالات / المدونة", href: "/admin/articles", icon: FileText },
  { label: "التعميمات", href: "/admin/messages", icon: Megaphone },
  { label: "إدارة الإعلانات", href: "/admin/ads", icon: Megaphone },
  { label: "البلاغات والدعم", href: "/admin/support", icon: Flag },
  { label: "التقارير", href: "/admin/reports", icon: BarChart3 },
  { label: "إعدادات المنصة", href: "/admin/settings", icon: Settings },
  { label: "الصلاحيات والأدوار", href: "/admin/roles", icon: ShieldCheck },
];

export default function AdminLayoutClient({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen w-72 bg-slate-900 text-white border-l border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Hello Staff" width={40} height={40} className="rounded-xl" />
            <div>
              <h1 className="text-base font-black leading-tight">لوحة الإدارة</h1>
              <p className="text-[10px] text-slate-400 font-medium">Hello Staff</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-900/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
                {isActive && <ChevronLeft className="w-4 h-4 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
              {adminName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{adminName}</p>
              <p className="text-[10px] text-slate-400">مدير المنصة</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span>الموقع</span>
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
