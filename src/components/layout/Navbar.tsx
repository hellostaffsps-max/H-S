"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChefHat, Bell, Home, Briefcase, PlusCircle, LayoutDashboard, MessageSquare, User, Menu, X, CheckCircle2, LogIn, LogOut, UserPlus, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import SwipeableNotification from '@/components/SwipeableNotification';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { unreadCount: unreadMessagesCount } = useUnreadMessages();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const isEmployer = profile?.role === 'employer';
  const isAdmin = profile?.role === 'admin';
  const isLoggedIn = !!user;

  const publicNavItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'الوظائف', path: '/jobs', icon: Briefcase },
  ];

  const authNavItems = [
    { name: 'نشر وظيفة', path: '/post-job', icon: PlusCircle, employerOnly: true },
    { name: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard },
    { name: 'الرسائل', path: '/messages', icon: MessageSquare },
  ];

  const navItems = [
    ...publicNavItems,
    ...(isLoggedIn ? authNavItems.filter(item => !item.employerOnly || isEmployer) : []),
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Back */}
          <div className="flex shrink-0 items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2">
              {pathname !== '/' && (
                <button
                  onClick={() => router.back()}
                  className="hidden md:flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-100 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                  title="رجوع"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <Link href="/" className="flex items-center gap-2 min-w-0" onClick={closeMenu}>
                <div className="bg-brand-600 p-1.5 rounded-lg shrink-0">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-lg sm:text-xl text-slate-800 truncate">Hello <span className="text-xs sm:text-sm font-normal text-slate-500">Staff</span></span>
              </Link>
            </div>
            
            <div className="flex items-center gap-1">
              {pathname !== '/' && (
                <button
                  onClick={() => router.back()}
                  className="md:hidden text-slate-500 hover:text-brand-600 hover:bg-slate-100 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="رجوع"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <button 
                className="md:hidden text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-reverse space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              const isMessages = item.path === '/messages';
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "relative flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-brand-600",
                    isActive ? "text-brand-600" : "text-slate-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                  {isMessages && unreadMessagesCount > 0 && (
                    <span className="absolute -top-2 -right-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[44px]",
                    pathname === '/profile' 
                      ? "bg-brand-600 text-white" 
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <User className="h-4 w-4" />
                  ملفي
                </Link>
                
                <div className="relative" ref={notificationsRef}>
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative text-slate-400 hover:text-slate-500 transition-colors p-2 rounded-full hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <span className="sr-only">الإشعارات</span>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 border-2 border-white"></span>
                      </span>
                    )}
                  </button>
                  
                  {isNotificationsOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 text-sm">الإشعارات</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => markAllAsRead()}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تحديد الكل كمقروء
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-sm">لا توجد إشعارات جديدة</div>
                        ) : (
                          <div>
                            {notifications.map((notification) => (
                              <SwipeableNotification
                                key={notification.id}
                                onDelete={() => deleteNotification(notification.id)}
                              >
                                <div 
                                  onClick={() => {
                                    if (!notification.is_read) markAsRead(notification.id);
                                    if (notification.link) {
                                      setIsNotificationsOpen(false);
                                      router.push(notification.link);
                                    }
                                  }}
                                  className={cn(
                                    "p-4 transition-colors hover:bg-slate-50 border-b border-slate-100",
                                    notification.link ? "cursor-pointer" : "cursor-default",
                                    !notification.is_read ? "bg-brand-50/30" : ""
                                  )}
                                >
                                  <div className="flex gap-3">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full mt-2 shrink-0",
                                      !notification.is_read ? "bg-brand-500" : "bg-transparent"
                                    )} />
                                    <div className="flex-1">
                                      <h4 className={cn("text-sm mb-1", !notification.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700")}>
                                        {notification.title}
                                      </h4>
                                      <p className="text-xs text-slate-500 leading-relaxed mb-2">{notification.message}</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          {new Date(notification.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {notification.link && (
                                          <span className="text-[10px] text-brand-600 font-medium">عرض التفاصيل ←</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </SwipeableNotification>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3 border-r border-slate-200 pr-3 mr-1">
                  <span className="text-sm font-medium text-slate-700">
                    {profile?.full_name || 'User'}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold text-sm">
                    {(profile?.full_name || 'U')[0].toUpperCase()}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="تسجيل الخروج"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 min-h-[44px]"
                >
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors min-h-[44px]"
                >
                  <UserPlus className="h-4 w-4" />
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const isMessages = item.path === '/messages';
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeMenu}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-3 rounded-xl text-sm sm:text-base font-medium transition-colors min-h-[44px]",
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
                {isMessages && unreadMessagesCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm mr-auto">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </Link>
            );
          })}
          
          {isLoggedIn ? (
            <>
              <div className="block border-t border-slate-100 my-2 pt-2"></div>
              <Link
                href="/profile"
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-2 px-3 py-3 rounded-xl text-sm sm:text-base font-medium transition-colors min-h-[44px]",
                  pathname === '/profile' ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <User className="h-5 w-5" />
                ملفي الشخصي
              </Link>
              <button
                onClick={() => { handleLogout(); closeMenu(); }}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm sm:text-base font-medium text-red-600 hover:bg-red-50 w-full text-right min-h-[44px]"
              >
                <LogOut className="h-5 w-5" />
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <div className="block border-t border-slate-100 my-2 pt-2"></div>
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm sm:text-base font-medium text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                <LogIn className="h-5 w-5" />
                تسجيل الدخول
              </Link>
              <Link
                href="/auth/signup"
                onClick={closeMenu}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm sm:text-base font-medium text-brand-600 hover:bg-brand-50 min-h-[44px]"
              >
                <UserPlus className="h-5 w-5" />
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
