"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const perm = Notification.permission;
    setPermission(perm);

    if (perm === "default") {
      const dismissed = localStorage.getItem("push-prompt-dismissed");
      if (!dismissed) {
        setTimeout(() => setShow(true), 8000);
      }
    }
  }, []);

  const requestPermission = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        // Register service worker for push
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          // Show a test notification
          reg.showNotification("Hello Staff 🎉", {
            body: "تم تفعيل الإشعارات بنجاح! ستتلقى تحديثات فورية.",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-72.png",
            dir: "rtl",
            lang: "ar",
          });
        }
      }
      setShow(false);
    } catch {
      setShow(false);
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("push-prompt-dismissed", "true");
  };

  if (!show || permission !== "default") return null;

  return (
    <div className="fixed top-20 inset-x-0 z-40 px-4 pointer-events-none" dir="rtl">
      <div className="max-w-sm mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 pointer-events-auto animate-in slide-in-from-top-5 duration-500">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-sm">تفعيل الإشعارات</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              احصل على إشعارات فورية عند وصول رسالة جديدة أو تحديث على طلباتك.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={requestPermission}
                className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition-colors"
              >
                تفعيل
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                لاحقاً
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
