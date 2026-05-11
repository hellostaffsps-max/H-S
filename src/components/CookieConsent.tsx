"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:left-4 sm:right-auto z-50 p-0 pointer-events-none" dir="rtl">
      <div className="w-[calc(100vw-32px)] sm:w-auto sm:max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl p-3 sm:p-4 pointer-events-auto animate-in slide-in-from-bottom-5 duration-500 flex items-center gap-3">
        <Cookie className="w-5 h-5 text-amber-500 shrink-0 hidden sm:block" />
        <p className="text-xs text-slate-300 leading-relaxed flex-1">
          نستخدم ملفات تعريف الارتباط لتحسين تجربتك.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors"
          >
            موافق
          </button>
          <button onClick={decline} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
