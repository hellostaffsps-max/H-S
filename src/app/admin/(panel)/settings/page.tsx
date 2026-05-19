"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Save, 
  Image as ImageIcon, 
  QrCode, 
  Building, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Settings as SettingsIcon,
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from "next/image";
import { useToast } from "@/hooks/useToast";

export default function PlatformSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [settings, setSettings] = useState({
    id: '',
    site_name: '',
    logo_url: '',
    wallet_qr_url: '',
    bank_details: '',
    maintenance_mode: false,
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('id, site_name, logo_url, wallet_qr_url, bank_details, maintenance_mode')
      .maybeSingle(); // Better than single() if it might be empty
    
    if (data) {
      setSettings({
        id: data.id || '',
        site_name: data.site_name || '',
        logo_url: data.logo_url || '',
        wallet_qr_url: data.wallet_qr_url || '',
        bank_details: data.bank_details || '',
        maintenance_mode: data.maintenance_mode || false,
      });
    }
    setLoading(false);
  }

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    
    try {
      const payload = {
        site_name: settings.site_name,
        bank_details: settings.bank_details,
        maintenance_mode: settings.maintenance_mode,
        logo_url: settings.logo_url,
        wallet_qr_url: settings.wallet_qr_url
      };

      let result: any;
      if (settings.id) {
        result = await supabase
          .from('platform_settings')
          .update(payload)
          .eq('id', settings.id);
      } else {
        result = await supabase
          .from('platform_settings')
          .insert(payload)
          .select('id, site_name, logo_url, wallet_qr_url, bank_details, maintenance_mode')
          .single();
        if (result.data) setSettings(prev => ({ ...prev, id: result.data.id }));
      }
        
      if (result.error) throw result.error;
      
      setSuccessMsg('تم حفظ الإعدادات بنجاح!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error.message);
      showToast('خطأ في الحفظ: ' + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'wallet_qr_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // In a real scenario, we would use Supabase Storage here.
      // For this implementation, we will use a temporary placeholder or direct url if storage is configured.
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${field}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('platform_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('platform_assets')
        .getPublicUrl(filePath);

      setSettings({ ...settings, [field]: publicUrl });
    } catch (error: any) {
      console.error('Error uploading file:', error.message);
      showToast('فشل رفع الملف. تأكد من إعدادات مستودع التخزين.', "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">إعدادات المنصة</h2>
            <p className="text-slate-500 text-sm">التحكم في الهوية البصرية وبيانات الدفع والخيارات المتقدمة</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          حفظ التغييرات
        </button>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 flex items-center gap-2 font-bold"
        >
          <CheckCircle2 className="h-5 w-5" />
          {successMsg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Identity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
            
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-slate-400" />
              الهوية البصرية
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المنصة</label>
                <input 
                  type="text" 
                  value={settings.site_name}
                  onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">شعار المنصة (Logo)</label>
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group/img cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                    {settings.logo_url ? (
                      <>
                        <Image src={settings.logo_url} alt="Logo" fill className="object-contain p-2" sizes="96px" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-500">رفع صورة</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-3">يفضل أن يكون الشعار بصيغة PNG وبخلفية شفافة بأبعاد متساوية (مربع).</p>
                    <input 
                      type="file" 
                      ref={logoInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo_url')}
                    />
                    <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                      اختيار ملف...
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
            
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Building className="h-5 w-5 text-slate-400" />
              إعدادات الدفع المحلي (Subscriptions)
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">بيانات الحساب البنكي</label>
                <textarea 
                  rows={4}
                  value={settings.bank_details}
                  onChange={(e) => setSettings({...settings, bank_details: e.target.value})}
                  placeholder="مثال: البنك العربي، رقم الحساب: 123456789، باسم: شركة التوظيف"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رمز الاستجابة السريعة للمحفظة (Wallet QR Code)</label>
                <div className="flex items-center gap-6">
                  <div className="h-32 w-32 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group/img cursor-pointer" onClick={() => qrInputRef.current?.click()}>
                    {settings.wallet_qr_url ? (
                      <>
                        <Image src={settings.wallet_qr_url} alt="QR Code" fill className="object-cover" sizes="128px" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <QrCode className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <span className="text-[10px] text-slate-500 block px-2">رفع QR Code</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-3">سيظهر هذا الرمز لأصحاب العمل عند اختيار الدفع عبر المحافظ الإلكترونية.</p>
                    <input 
                      type="file" 
                      ref={qrInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'wallet_qr_url')}
                    />
                    <button onClick={() => qrInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                      اختيار ملف...
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Danger Zone */}
        <div className="space-y-8">
          <div className="bg-red-50/50 p-8 rounded-3xl border border-red-100 relative overflow-hidden group">
            <h3 className="text-lg font-black text-red-900 mb-6 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              المنطقة الخطرة
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900">وضع الصيانة</h4>
                  <p className="text-xs text-slate-500 mt-1">إيقاف وصول المستخدمين للمنصة مؤقتاً</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.maintenance_mode}
                    onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
