"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Briefcase, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChefHat,
  ChevronLeft,
  Bell,
  Search,
  Shield,
  FileText,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
        if (pathname === '/admin/login') {
          router.push('/admin');
        }
      } else {
        await supabase.auth.signOut();
        router.push('/admin/login');
      }
      setLoading(false);
    };

    checkAdmin();
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't wrap login page with dashboard layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const menuItems = [
    { name: 'الرئيسية', icon: LayoutDashboard, href: '/admin' },
    { name: 'المستخدمين', icon: Users, href: '/admin/users' },
    { name: 'الوظائف', icon: Briefcase, href: '/admin/jobs' },
    { name: 'الاشتراكات', icon: Shield, href: '/admin/subscriptions' },
    { name: 'المقالات', icon: FileText, href: '/admin/articles' },
    { name: 'الرسائل', icon: MessageSquare, href: '/admin/messages' },
    { name: 'الإعدادات', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" dir="rtl">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-200 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-xl">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">HELLO ADMIN</span>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                    isActive 
                      ? 'bg-brand-50 text-brand-700' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'group-hover:text-slate-900'}`} />
                  <span className="font-bold">{item.name}</span>
                  {isActive && <ChevronLeft className="mr-auto h-4 w-4" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold"
            >
              <LogOut className="h-5 w-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:mr-72' : ''}`}>
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl lg:hidden"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث..." 
                className="bg-slate-50 border-none rounded-xl pr-10 pl-4 py-2 w-64 focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-400 hover:text-brand-600 relative transition-colors"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-sm">الإشعارات</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => markAllAsRead()}
                        className="text-[10px] text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        تحديد الكل كمقروء
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-xs font-medium">لا توجد إشعارات جديدة</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.id);
                            }}
                            className={cn(
                              "p-4 cursor-pointer hover:bg-slate-50 transition-colors",
                              !notif.is_read ? "bg-brand-50/20" : ""
                            )}
                          >
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                !notif.is_read ? "bg-brand-500" : "bg-transparent"
                              )} />
                              <div>
                                <p className={cn("text-xs leading-snug mb-1", !notif.is_read ? "font-bold text-slate-900" : "text-slate-600")}>
                                  {notif.title}
                                </p>
                                <p className="text-[10px] text-slate-400 mb-2">{notif.message}</p>
                                <div className="flex items-center gap-1 text-[9px] text-slate-300 font-bold">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(notif.created_at).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 ml-2">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-slate-900">المدير العام</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
