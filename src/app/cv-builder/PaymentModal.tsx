"use client";
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { requestCVDownload } from '@/app/actions/cv';
import { X, Upload, CreditCard, Building, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function PaymentModal({ isOpen, onClose, userId }: Props) {
  const [settings, setSettings] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      supabase.from('platform_settings').select('wallet_qr_url, bank_details').limit(1).single()
        .then(({ data }) => { if (data) setSettings(data); });
    }
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${userId}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('payment_receipts').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('payment_receipts').getPublicUrl(fileName);
      setReceiptUrl(publicUrl);
    } catch {
      setError('حدث خطأ أثناء رفع الوصل');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!receiptUrl) return;
    setSubmitting(true);
    setError('');
    const result = await requestCVDownload(receiptUrl);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'حدث خطأ');
    }
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">تصدير السيرة الذاتية - ₪10</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">تم إرسال طلبك بنجاح!</h3>
            <p className="text-slate-500 text-sm mb-6">سيتم مراجعة وصل الدفع من قبل المشرف. ستتلقى إشعاراً عند الموافقة وبإمكانك حينها تصدير سيرتك الذاتية.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">حسناً</button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Bank Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">التحويل البنكي</h3>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{settings?.bank_details || 'تواصل مع الدعم'}</p>
            </div>

            {/* Wallet QR */}
            {settings?.wallet_qr_url && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">المحفظة الإلكترونية</h3>
                </div>
                <img src={settings.wallet_qr_url} alt="QR" className="w-36 h-36 object-contain mx-auto rounded-lg border" />
              </div>
            )}

            {/* Upload Receipt */}
            {!receiptUrl ? (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors">
                {uploading ? <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" /> : <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />}
                <p className="font-bold text-sm text-slate-700">{uploading ? 'جاري الرفع...' : 'ارفع صورة وصل الدفع'}</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG - أقصى 5MB</p>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border h-32 bg-slate-50">
                  <img src={receiptUrl} alt="Receipt" className="w-full h-full object-contain p-2" />
                  <button onClick={() => setReceiptUrl('')} className="absolute top-2 left-2 bg-white/90 text-red-600 px-2 py-1 rounded text-xs font-bold">تغيير</button>
                </div>
                <button onClick={handleSubmit} disabled={submitting} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  إرسال طلب التصدير
                </button>
              </div>
            )}

            {error && <p className="text-red-600 text-sm text-center font-medium">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
