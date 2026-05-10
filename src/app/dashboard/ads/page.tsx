"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  Megaphone, 
  Plus, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Trash2, 
  Loader2, 
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

type AdStatus = 'pending' | 'approved' | 'rejected' | 'archived';

type Ad = {
  id: string;
  title: string;
  media_url: string;
  media_type: 'image' | 'video';
  link_url: string | null;
  status: AdStatus;
  start_date: string | null;
  end_date: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export default function EstablishmentAds() {
  const { user, profile } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [newAd, setNewAd] = useState({
    title: '',
    media_url: '',
    media_type: 'image' as 'image' | 'video',
    link_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchAds();
    }
  }, [user]);

  async function fetchAds() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isImage && !isVideo) {
      alert('يرجى اختيار صورة أو فيديو فقط');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `establishment_media/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath);

      setNewAd({ 
        ...newAd, 
        media_url: publicUrl, 
        media_type: isVideo ? 'video' : 'image' 
      });
      setUploadProgress(100);
    } catch (error: any) {
      console.error('Error uploading:', error.message);
      alert('فشل رفع الملف');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.media_url) {
      alert('يرجى رفع ملف إعلاني أولاً');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .insert([{
          title: newAd.title,
          media_url: newAd.media_url,
          media_type: newAd.media_type,
          link_url: newAd.link_url || null,
          created_by: user?.id,
          status: 'pending',
          is_active: false // Default to false until approved
        }])
        .select()
        .single();

      if (error) throw error;

      setAds([data, ...ads]);
      setIsModalOpen(false);
      setNewAd({
        title: '',
        media_url: '',
        media_type: 'image',
        link_url: ''
      });
    } catch (error: any) {
      alert('حدث خطأ أثناء إرسال الإعلان للمراجعة: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAd = async (ad: Ad) => {
    if (ad.status === 'approved') {
      alert('لا يمكن حذف إعلان تمت الموافقة عليه ونشره. يرجى التواصل مع الإدارة.');
      return;
    }
    if (!confirm('هل أنت متأكد من سحب هذا الإعلان؟')) return;

    try {
      const { error: dbError } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', ad.id);

      if (dbError) throw dbError;

      if (ad.media_url.includes('/storage/v1/object/public/ads/')) {
        const path = ad.media_url.split('/ads/')[1];
        await supabase.storage.from('ads').remove([path]);
      }

      setAds(ads.filter(a => a.id !== ad.id));
    } catch (error: any) {
      alert('فشل حذف الإعلان');
    }
  };

  if (subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!subscription.allow_ads) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <Megaphone className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">ميزة الإعلانات غير متاحة</h2>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            بافتك الحالية لا تدعم إنشاء إعلانات في الصفحة الرئيسية. يرجى ترقية الباقة للتمتع بهذه الميزة والوصول لآلاف الموظفين والباحثين عن عمل.
          </p>
          <div className="pt-4">
            <Link 
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-2xl font-black hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
            >
              عرض الباقات والترقية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-4 bg-brand-50 rounded-2xl text-brand-600 shadow-sm">
            <Megaphone className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">إعلاناتي</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">قم بإدارة إعلانات منشأتك التي تظهر في الصفحة الرئيسية للمنصة</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-2xl font-black hover:bg-brand-700 shadow-xl shadow-brand-100 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          إنشاء إعلان جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            </div>
          ) : ads.length === 0 ? (
            <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center">
              <div className="inline-flex p-6 bg-slate-50 rounded-3xl mb-6 text-slate-300">
                <Megaphone className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">لم تقم بإنشاء أي إعلانات بعد</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">ابدأ بإنشاء إعلانك الأول ليتم مراجعته ونشره في الصفحة الرئيسية.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 text-brand-600 font-black hover:underline"
              >
                اضغط هنا للبدء ←
              </button>
            </div>
          ) : (
            ads.map((ad) => (
              <motion.div
                layout
                key={ad.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
              >
                <div className="relative h-56 bg-slate-50 overflow-hidden">
                  {ad.media_type === 'video' ? (
                    <video 
                      src={ad.media_url} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      muted 
                      loop 
                      playsInline 
                      onMouseOver={(e) => e.currentTarget.play()}
                      onMouseOut={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  )}
                  
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="bg-black/40 backdrop-blur-md text-white p-2 rounded-xl border border-white/10">
                      {ad.media_type === 'video' ? <VideoIcon className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <StatusBadge status={ad.status} />
                  </div>
                </div>

                <div className="p-6 flex-grow space-y-5">
                  <div>
                    <h3 className="font-black text-slate-900 truncate text-lg">{ad.title}</h3>
                    {ad.link_url && (
                      <a href={ad.link_url} target="_blank" className="text-xs text-brand-600 hover:underline flex items-center gap-1.5 mt-2 font-bold">
                        <ExternalLink className="h-3.5 w-3.5" />
                        رابط الوجهة
                      </a>
                    )}
                  </div>

                  {ad.status === 'rejected' && ad.rejection_reason && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <p className="text-[10px] font-black text-red-400 uppercase mb-1">سبب الرفض:</p>
                      <p className="text-xs text-red-700 font-bold leading-relaxed">{ad.rejection_reason}</p>
                    </div>
                  )}

                  {ad.status === 'approved' && ad.end_date && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-xl">
                      <Clock className="h-3.5 w-3.5 text-brand-500" />
                      ينتهي في: {new Date(ad.end_date).toLocaleDateString('ar-EG')}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 font-bold">تاريخ الطلب: {new Date(ad.created_at).toLocaleDateString('ar-EG')}</p>
                    {ad.status !== 'approved' && (
                      <button 
                        onClick={() => deleteAd(ad)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                        title="سحب الطلب"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Create Ad Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">إنشاء إعلان جديد</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="h-7 w-7" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-sm font-black text-slate-700">الملف الإعلاني (صورة أو فيديو) *</label>
                  <div className="relative">
                    {newAd.media_url ? (
                      <div className="relative h-64 w-full rounded-3xl overflow-hidden group shadow-inner bg-slate-50">
                        {newAd.media_type === 'video' ? (
                          <video src={newAd.media_url} className="w-full h-full object-cover" muted autoPlay loop />
                        ) : (
                          <img src={newAd.media_url} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer p-5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all shadow-xl">
                            <Upload className="h-7 w-7" />
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-64 w-full border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all group">
                        <div className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform">
                          <div className="p-5 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-brand-500 group-hover:bg-white group-hover:shadow-lg transition-all">
                            <Upload className="h-10 w-10" />
                          </div>
                          <div className="text-center">
                            <span className="block text-base text-slate-600 font-black">اضغط لرفع ملف الإعلان</span>
                            <span className="text-xs text-slate-400 font-bold">يفضل نسبة 3:1 (مثل 1920x640)</span>
                          </div>
                        </div>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                      </label>
                    )}
                    
                    {uploadProgress > 0 && (
                      <div className="absolute bottom-6 left-6 right-6 h-2 bg-white/30 backdrop-blur-md rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-brand-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-amber-900">تعليمات الإعلان:</p>
                      <ul className="text-xs text-amber-700 space-y-1 font-bold leading-relaxed list-disc pr-4">
                        <li>سيتم عرض الإعلان في الصفحة الرئيسية بعد مراجعته من قبل الإدارة.</li>
                        <li>يفضل استخدام حجم <span className="font-black text-amber-900">1920x640 بكسل</span> لتجنب قص المحتوى.</li>
                        <li>تأكد من عدم وجود محتوى يخالف سياسات المنصة.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-slate-700">عنوان الإعلان *</label>
                    <input
                      required
                      type="text"
                      value={newAd.title}
                      onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 font-bold transition-all"
                      placeholder="عنوان تعريفي للإعلان (يظهر لك فقط)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-slate-700">رابط التوجيه (اختياري)</label>
                    <input
                      type="url"
                      value={newAd.link_url}
                      onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-left font-medium transition-all"
                      dir="ltr"
                      placeholder="https://example.com/promo"
                    />
                    <p className="text-[10px] text-slate-400 font-bold mr-1">الرابط الذي سيتم فتح عند النقر على الإعلان</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newAd.media_url}
                    className="flex-1 py-5 bg-brand-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Megaphone className="h-6 w-6" />}
                    إرسال للمراجعة والنشر
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-10 py-5 bg-slate-50 text-slate-500 rounded-[1.5rem] font-black hover:bg-slate-100 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: AdStatus }) {
  const configs: Record<AdStatus, { icon: any, label: string, color: string }> = {
    pending: { icon: Clock, label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { icon: CheckCircle2, label: 'نشط حالياً', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-emerald-100/50 shadow-lg' },
    rejected: { icon: AlertCircle, label: 'مرفوض', color: 'bg-red-100 text-red-700 border-red-200' },
    archived: { icon: History, label: 'مؤرشف', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border backdrop-blur-md ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
}
