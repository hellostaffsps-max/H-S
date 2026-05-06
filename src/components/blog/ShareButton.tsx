"use client";

import { Share2 } from "lucide-react";

export default function ShareButton() {
  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ الرابط بنجاح');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200"
    >
      <Share2 className="h-4 w-4" />
      نسخ الرابط
    </button>
  );
}
