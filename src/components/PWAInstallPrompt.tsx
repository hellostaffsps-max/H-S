"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (7 days cooldown)
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt);
      if (elapsed < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    // Android/Desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    setShowIOSModal(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 sm:bottom-6 inset-x-0 z-40 px-4 pointer-events-none" dir="rtl">
        <div className="max-w-md mx-auto bg-gradient-to-r from-brand-600 to-emerald-600 rounded-2xl shadow-2xl shadow-brand-900/30 p-4 pointer-events-auto animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm">حمّل Hello Staff كتطبيق!</h3>
              <p className="text-[11px] text-white/80 mt-0.5">وصول أسرع + إشعارات فورية + بدون متصفح</p>
            </div>
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-brand-700 rounded-xl text-xs font-bold hover:bg-white/90 transition-colors shrink-0"
            >
              <Download className="w-4 h-4 inline ml-1" />
              تثبيت
            </button>
            <button onClick={dismiss} className="text-white/60 hover:text-white p-1 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={dismiss}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="bg-gradient-to-l from-brand-600 to-brand-700 p-6 flex items-center gap-4 relative">
              <button onClick={dismiss} className="absolute top-3 left-3 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <Smartphone className="h-7 w-7 text-brand-600" />
              </div>
              <div className="text-white">
                <h2 className="font-black text-lg leading-tight">تثبيت Hello Staff</h2>
                <p className="text-white/80 text-sm mt-0.5">3 خطوات بسيطة فقط</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Features */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { icon: "⚡", text: "أسرع بكثير" },
                  { icon: "🔔", text: "إشعارات فورية" },
                  { icon: "📱", text: "كتطبيق مستقل" },
                ].map((f, i) => (
                  <div key={i} className="text-center p-2 bg-slate-50 rounded-xl">
                    <div className="text-lg mb-0.5">{f.icon}</div>
                    <p className="text-[10px] font-bold text-slate-600">{f.text}</p>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-sm shrink-0">1</div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 flex-wrap">
                    <span>اضغط على</span>
                    <Share className="h-4 w-4 text-blue-500" />
                    <span className="font-bold">زر المشاركة</span>
                    <span>في الأسفل</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-sm shrink-0">2</div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 flex-wrap">
                    <span>اختر</span>
                    <PlusSquare className="h-4 w-4 text-slate-500" />
                    <span className="font-bold">إضافة إلى الشاشة الرئيسية</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-black text-sm shrink-0">3</div>
                  <p className="text-sm text-slate-700">
                    اضغط <span className="font-bold">إضافة</span> وسيظهر التطبيق على شاشتك!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 space-y-2">
              <button onClick={dismiss} className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors">
                فهمت، شكراً!
              </button>
              <p className="text-[10px] text-slate-400 text-center">مجاني تماماً · لا يحتاج متجر تطبيقات</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
