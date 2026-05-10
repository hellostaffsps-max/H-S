"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Ad = {
  id: string;
  title: string;
  media_url: string;
  media_type: 'image' | 'video';
  link_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
};

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [newAd, setNewAd] = useState({
    title: '',
    media_url: '',
    media_type: 'image' as 'image' | 'video',
    link_url: '',
    is_active: true,
    order_index: 0
  });

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('order_index', { ascending: true });

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

    // Validate file type
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
      const filePath = `banner_media/${fileName}`;

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
          is_active: newAd.is_active,
          order_index: ads.length
        }])
        .select()
        .single();

      if (error) throw error;

      setAds([...ads, data]);
      setIsModalOpen(false);
      setNewAd({
        title: '',
        media_url: '',
        media_type: 'image',
        link_url: '',
        is_active: true,
        order_index: 0
      });
    } catch (error: any) {
      alert('حدث خطأ أثناء الحفظ: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (ad: Ad) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ is_active: !ad.is_active })
        .eq('id', ad.id);

      if (error) throw error;
      setAds(ads.map(a => a.id === ad.id ? { ...a, is_active: !a.is_active } : a));
    } catch (error: any) {
      alert('فشل تحديث الحالة');
    }
  };

  const deleteAd = async (ad: Ad) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', ad.id);

      if (dbError) throw dbError;

      // 2. Try to delete from storage if it's a supabase URL
      if (ad.media_url.includes('/storage/v1/object/public/ads/')) {
        const path = ad.media_url.split('/ads/')[1];
        await supabase.storage.from('ads').remove([path]);
      }

      setAds(ads.filter(a => a.id !== ad.id));
    } catch (error: any) {
      alert('فشل حذف الإعلان');
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === ads.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newAds = [...ads];
    const temp = newAds[index];
    newAds[index] = newAds[newIndex];
    newAds[newIndex] = temp;

    // Update local state first for instant UI feedback
    setAds(newAds);

    // Sync with DB
    try {
      await Promise.all([
        supabase.from('advertisements').update({ order_index: index }).eq('id', newAds[index].id),
        supabase.from('advertisements').update({ order_index: newIndex }).eq('id', newAds[newIndex].id)
      ]);
    } catch (error) {
      console.error('Order sync failed:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">إدارة الإعلانات المتحركة</h2>
            <p className="text-slate-500 text-sm">أضف صور أو فيديوهات إعلانية تظهر في الصفحة الرئيسية للمنصة</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all"
        >
          <Plus className="h-5 w-5" />
          إضافة إعلان جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            </div>
          ) : ads.length === 0 ? (
            <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-3xl p-20 text-center">
              <div className="inline-flex p-5 bg-slate-50 rounded-full mb-4">
                <Megaphone className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد إعلانات حالياً</h3>
              <p className="text-slate-500">ابدأ بإضافة أول إعلان ليظهر للمستخدمين</p>
            </div>
          ) : (
            ads.map((ad, index) => (
              <motion.div
                layout
                key={ad.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all flex flex-col ${ad.is_active ? 'border-slate-100' : 'border-slate-200 grayscale'}`}
              >
                <div className="relative h-48 bg-slate-50">
                  {ad.media_type === 'video' ? (
                    <video 
                      src={ad.media_url} 
                      className="w-full h-full object-cover" 
                      muted 
                      loop 
                      playsInline 
                      onMouseOver={(e) => e.currentTarget.play()}
                      onMouseOut={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
                  )}
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    {ad.media_type === 'video' ? (
                      <div className="bg-black/50 backdrop-blur-md text-white p-1.5 rounded-lg">
                        <VideoIcon className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="bg-black/50 backdrop-blur-md text-white p-1.5 rounded-lg">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button 
                      onClick={() => moveOrder(index, 'up')}
                      disabled={index === 0}
                      className="bg-white/90 backdrop-blur-md p-1.5 rounded-lg text-slate-600 hover:text-brand-600 disabled:opacity-30 shadow-sm"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => moveOrder(index, 'down')}
                      disabled={index === ads.length - 1}
                      className="bg-white/90 backdrop-blur-md p-1.5 rounded-lg text-slate-600 hover:text-brand-600 disabled:opacity-30 shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-grow space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 truncate">{ad.title}</h3>
                    {ad.link_url && (
                      <a href={ad.link_url} target="_blank" className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1 font-medium">
                        <ExternalLink className="h-3 w-3" />
                        رابط التوجيه
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => toggleStatus(ad)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        ad.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {ad.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      {ad.is_active ? 'نشط' : 'معطل'}
                    </button>

                    <button 
                      onClick={() => deleteAd(ad)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add Ad Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">إضافة إعلان جديد</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">الملف الإعلاني (صورة أو فيديو)</label>
                  <div className="relative">
                    {newAd.media_url ? (
                      <div className="relative h-56 w-full rounded-2xl overflow-hidden group">
                        {newAd.media_type === 'video' ? (
                          <video src={newAd.media_url} className="w-full h-full object-cover" muted autoPlay loop />
                        ) : (
                          <img src={newAd.media_url} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all">
                            <Upload className="h-6 w-6" />
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-56 w-full border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-brand-400 hover:bg-slate-50 transition-all group">
                        <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                          <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                            <Upload className="h-8 w-8" />
                          </div>
                          <span className="text-sm text-slate-500 font-bold">اضغط لرفع ملف الإعلان</span>
                          <span className="text-[10px] text-slate-400">يدعم الصور ومقاطع الفيديو</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                      </label>
                    )}
                    
                    {uploadProgress > 0 && (
                      <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-white/30 backdrop-blur-md rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-brand-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">عنوان الإعلان</label>
                    <input
                      required
                      type="text"
                      value={newAd.title}
                      onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold"
                      placeholder="عنوان تعريفي (للإدارة فقط)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">رابط التوجيه (اختياري)</label>
                    <input
                      type="url"
                      value={newAd.link_url}
                      onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-left"
                      dir="ltr"
                      placeholder="https://..."
                    />
                    <p className="text-[10px] text-slate-400 mt-1 mr-1">الرابط الذي سينتقل إليه المستخدم عند الضغط على الإعلان</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newAd.media_url}
                    className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ ونشر الإعلان'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all"
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
