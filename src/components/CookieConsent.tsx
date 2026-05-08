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
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none" dir="rtl">
      <div className="max-w-lg mx-auto sm:mx-0 sm:mr-0 sm:ml-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 pointer-events-auto animate-in slide-in-from-bottom-5 duration-500">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-sm mb-1">نستخدم ملفات تعريف الارتباط 🍪</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة وتقديم محتوى مخصص. يمكنك قبولها أو رفضها.
            </p>
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition-colors"
              >
                قبول الكل
              </button>
              <button
                onClick={decline}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                رفض
              </button>
            </div>
          </div>
          <button onClick={decline} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
