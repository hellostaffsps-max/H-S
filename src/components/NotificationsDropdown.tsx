"use client";

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import SwipeableNotification from './SwipeableNotification';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative"
      >
        <span className="sr-only">الإشعارات</span>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                }}
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
                          setIsOpen(false);
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
  );
}
