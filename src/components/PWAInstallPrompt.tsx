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
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    // Android/Desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
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
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 sm:bottom-6 inset-x-0 z-40 px-4 pointer-events-none" dir="rtl">
        <div className="max-w-md mx-auto bg-gradient-to-r from-brand-600 to-emerald-600 rounded-2xl shadow-2xl p-4 pointer-events-auto animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm">حمّل Hello Staff كتطبيق!</h3>
              <p className="text-[11px] text-white/80 mt-0.5">وصول أسرع + إشعارات فورية</p>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowIOSModal(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">تثبيت التطبيق على iPhone</h2>
              <button onClick={() => setShowIOSModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-blue-600 font-bold">1</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">اضغط على زر المشاركة</p>
                  <p className="text-xs text-slate-500 mt-1">اضغط على أيقونة <Share className="w-3.5 h-3.5 inline text-blue-600" /> في شريط المتصفح السفلي</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-blue-600 font-bold">2</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">اختر &quot;إضافة إلى الشاشة الرئيسية&quot;</p>
                  <p className="text-xs text-slate-500 mt-1">مرر للأسفل واضغط على <PlusSquare className="w-3.5 h-3.5 inline text-slate-600" /> Add to Home Screen</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0 text-green-600 font-bold">3</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">اضغط &quot;إضافة&quot;</p>
                  <p className="text-xs text-slate-500 mt-1">سيظهر التطبيق على شاشتك الرئيسية كتطبيق مستقل</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowIOSModal(false)} className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors">
                فهمت، شكراً!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
