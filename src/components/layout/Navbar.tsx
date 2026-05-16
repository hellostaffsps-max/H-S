"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Home, Briefcase, PlusCircle, LayoutDashboard, MessageSquare, User, Menu, X, LogIn, LogOut, UserPlus, ArrowLeft, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import NotificationsDropdown from '@/components/NotificationsDropdown';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { unreadCount: unreadMessagesCount } = useUnreadMessages();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isEmployer = profile?.role === 'employer';
  const isLoggedIn = !!user;

  const publicNavItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'الوظائف', path: '/jobs', icon: Briefcase },
  ];

  const authNavItems = [
    { name: 'نشر وظيفة', path: '/post-job', icon: PlusCircle, employerOnly: true },
    { name: 'الأكاديمية', path: '/academy', icon: BookOpen, seekerOnly: true },
    { name: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard },
    { name: 'الرسائل', path: '/messages', icon: MessageSquare },
  ];

  const navItems = [
    ...publicNavItems,
    ...(isLoggedIn 
      ? authNavItems.filter(item => 
          (!item.employerOnly && !item.seekerOnly) || 
          (item.employerOnly && isEmployer) || 
          (item.seekerOnly && !isEmployer)
        ) 
      : []),
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Back */}
          <div className="flex shrink-0 items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-2">
              {pathname !== '/' && (
                <button
                  onClick={() => router.back()}
                  className="hidden lg:flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-100 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                  title="رجوع"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <Link href="/" className="flex items-center gap-2 min-w-0" onClick={closeMenu}>
                <Image src="/logo.png" alt="Hello Staff" width={36} height={36} className="shrink-0" />
                <span className="font-bold text-lg sm:text-xl text-slate-800 truncate">Hello <span className="text-xs sm:text-sm font-normal text-slate-500">Staff</span></span>
              </Link>
            </div>
            
            <div className="flex items-center gap-1">
              {pathname !== '/' && (
                <button
                  onClick={() => router.back()}
                  className="lg:hidden text-slate-500 hover:text-brand-600 hover:bg-slate-100 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="رجوع"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              {isLoggedIn && (
                <div className="lg:hidden relative">
                  <NotificationsDropdown />
                </div>
              )}
              <button 
                className="lg:hidden text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
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
          <div className="hidden lg:flex items-center gap-3">
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
                
                <div className="relative">
                  <NotificationsDropdown />
                </div>
                
                <div className="flex items-center gap-3 border-r border-slate-200 pr-3 mr-1">
                  <span className="text-sm font-medium text-slate-700">
                    {profile?.full_name || 'User'}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold text-sm overflow-hidden border border-slate-200">
                    {profile?.avatar_url ? (
                      <Image 
                        src={profile.avatar_url} 
                        alt={profile.full_name || "User"} 
                        width={32} 
                        height={32} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (profile?.full_name || 'U')[0].toUpperCase()
                    )}
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
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
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
                {profile?.avatar_url ? (
                  <div className="h-6 w-6 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    <Image 
                      src={profile.avatar_url} 
                      alt="" 
                      width={24} 
                      height={24} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
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
