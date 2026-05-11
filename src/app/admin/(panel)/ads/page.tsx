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
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Ban,
  RotateCcw,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from "next/image";

type AdStatus = 'pending' | 'approved' | 'rejected' | 'archived';

type Ad = {
  id: string;
  title: string;
  media_url: string;
  media_type: 'image' | 'video';
  link_url: string | null;
  is_active: boolean;
  status: AdStatus;
  start_date: string | null;
  end_date: string | null;
  rejection_reason: string | null;
  cancellation_requested: boolean;
  order_index: number;
  created_at: string;
  created_by: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
  employers?: {
    company_name: string;
  };
};

export default function AdminAds() {
  const [activeTab, setActiveTab] = useState<'system' | 'requests' | 'active_employers' | 'cancellations' | 'archived'>('system');
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [approvalModal, setApprovalModal] = useState<{ open: boolean, duration: number, rejectionReason: string }>({ 
    open: false, 
    duration: 30, 
    rejectionReason: '' 
  });

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
        .select(`
          *,
          profiles:created_by (
            full_name,
            email
          )
        `)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch employer company names for ads with created_by
      const adsWithCreators = data || [];
      const creatorIds = adsWithCreators
        .filter(a => a.created_by)
        .map(a => a.created_by);
      
      let employerMap: Record<string, string> = {};
      if (creatorIds.length > 0) {
        const { data: employers } = await supabase
          .from('employers')
          .select('profile_id, company_name')
          .in('profile_id', creatorIds);
        
        if (employers) {
          employers.forEach(e => {
            employerMap[e.profile_id] = e.company_name;
          });
        }
      }
      
      // Merge employer data into ads
      const enrichedAds = adsWithCreators.map(ad => ({
        ...ad,
        employers: ad.created_by && employerMap[ad.created_by] 
          ? { company_name: employerMap[ad.created_by] } 
          : undefined
      }));
      
      setAds(enrichedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  }

  const systemAds = ads.filter(a => !a.created_by && a.status !== 'archived');
  const requests = ads.filter(a => a.created_by && a.status === 'pending');
  const activeEmployerAds = ads.filter(a => a.created_by && a.status === 'approved' && !a.cancellation_requested);
  const cancellations = ads.filter(a => a.created_by && a.cancellation_requested && a.status === 'approved');
  const archivedAds = ads.filter(a => a.status === 'archived');

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
          status: 'approved',
          order_index: systemAds.length
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

  const approveAd = async () => {
    if (!selectedAd) return;
    setIsSubmitting(true);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + approvalModal.duration);

    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ 
          status: 'approved',
          is_active: true,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          order_index: ads.length
        })
        .eq('id', selectedAd.id);

      if (error) throw error;
      
      setAds(ads.map(a => a.id === selectedAd.id ? { 
        ...a, 
        status: 'approved', 
        is_active: true,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      } : a));
      
      setApprovalModal({ ...approvalModal, open: false });
      setSelectedAd(null);
    } catch (error: any) {
      alert('فشل الموافقة على الإعلان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rejectAd = async () => {
    if (!selectedAd || !approvalModal.rejectionReason) {
      alert('يرجى ذكر سبب الرفض');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ 
          status: 'rejected',
          is_active: false,
          rejection_reason: approvalModal.rejectionReason
        })
        .eq('id', selectedAd.id);

      if (error) throw error;
      
      setAds(ads.map(a => a.id === selectedAd.id ? { 
        ...a, 
        status: 'rejected', 
        is_active: false,
        rejection_reason: approvalModal.rejectionReason
      } : a));
      
      setApprovalModal({ ...approvalModal, open: false });
      setSelectedAd(null);
    } catch (error: any) {
      alert('فشل رفض الإعلان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveCancellation = async (ad: Ad) => {
    if (!confirm('هل أنت متأكد من الموافقة على طلب إلغاء هذا الإعلان؟ سيتم أرشفته.')) return;
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ status: 'archived', is_active: false, cancellation_requested: false })
        .eq('id', ad.id);
      if (error) throw error;
      setAds(ads.map(a => a.id === ad.id ? { ...a, status: 'archived' as AdStatus, is_active: false, cancellation_requested: false } : a));
    } catch (error) {
      alert('فشل أرشفة الإعلان');
    }
  };

  const rejectCancellation = async (ad: Ad) => {
    if (!confirm('هل أنت متأكد من رفض طلب إلغاء هذا الإعلان؟ سيبقى نشطاً.')) return;
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ cancellation_requested: false })
        .eq('id', ad.id);
      if (error) throw error;
      setAds(ads.map(a => a.id === ad.id ? { ...a, cancellation_requested: false } : a));
    } catch (error) {
      alert('فشل رفض طلب الإلغاء');
    }
  };

  const republishAd = async (ad: Ad) => {
    const duration = prompt('أدخل عدد أيام النشر:', '30');
    if (!duration) return;
    const days = parseInt(duration);
    if (isNaN(days) || days <= 0) { alert('يرجى إدخال رقم صحيح'); return; }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ 
          status: 'approved', 
          is_active: true, 
          cancellation_requested: false,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
        .eq('id', ad.id);
      if (error) throw error;
      setAds(ads.map(a => a.id === ad.id ? { 
        ...a, status: 'approved' as AdStatus, is_active: true, cancellation_requested: false,
        start_date: startDate.toISOString(), end_date: endDate.toISOString()
      } : a));
    } catch (error) {
      alert('فشل إعادة نشر الإعلان');
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down', list: Ad[]) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const currentAd = list[index];
    const targetAd = list[newIndex];

    const updatedAds = ads.map(a => {
      if (a.id === currentAd.id) return { ...a, order_index: targetAd.order_index };
      if (a.id === targetAd.id) return { ...a, order_index: currentAd.order_index };
      return a;
    }).sort((a, b) => a.order_index - b.order_index);

    setAds(updatedAds);

    try {
      await Promise.all([
        supabase.from('advertisements').update({ order_index: targetAd.order_index }).eq('id', currentAd.id),
        supabase.from('advertisements').update({ order_index: currentAd.order_index }).eq('id', targetAd.id)
      ]);
    } catch (error) {
      console.error('Order sync failed:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-brand-50 rounded-2xl text-brand-600">
              <Megaphone className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">إدارة الإعلانات</h2>
              <p className="text-slate-500 text-sm font-medium">تحكم في الإعلانات المعروضة وراجع طلبات المنشآت</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-2xl font-black hover:bg-brand-700 shadow-xl shadow-brand-100 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" />
            إضافة إعلان نظام
          </button>
        </div>

        <div className="flex flex-wrap p-1.5 bg-slate-50 rounded-2xl w-fit gap-1">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${
              activeTab === 'system' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            إعلانات النظام ({systemAds.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'requests' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            طلبات النشر
            {requests.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active_employers')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'active_employers' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            المنشآت النشطة ({activeEmployerAds.length})
          </button>
          <button
            onClick={() => setActiveTab('cancellations')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'cancellations' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            طلبات الإلغاء
            {cancellations.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
                {cancellations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'archived' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الأرشيف ({archivedAds.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            </div>
          ) : (activeTab === 'system' ? systemAds : activeTab === 'requests' ? requests : activeTab === 'active_employers' ? activeEmployerAds : activeTab === 'cancellations' ? cancellations : archivedAds).length === 0 ? (
            <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center">
              <div className="inline-flex p-6 bg-slate-50 rounded-full mb-4">
                {activeTab === 'archived' ? <History className="h-12 w-12 text-slate-300" /> : activeTab === 'cancellations' ? <Ban className="h-12 w-12 text-slate-300" /> : activeTab === 'active_employers' ? <CheckCircle2 className="h-12 w-12 text-slate-300" /> : <Megaphone className="h-12 w-12 text-slate-300" />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {activeTab === 'system' ? 'لا توجد إعلانات نظام' : activeTab === 'requests' ? 'لا توجد طلبات نشر معلقة' : activeTab === 'active_employers' ? 'لا توجد إعلانات منشآت نشطة' : activeTab === 'cancellations' ? 'لا توجد طلبات إلغاء' : 'لا توجد إعلانات مؤرشفة'}
              </h3>
              <p className="text-slate-500 font-medium">كل شيء تحت السيطرة!</p>
            </div>
          ) : (
            (activeTab === 'system' ? systemAds : activeTab === 'requests' ? requests : activeTab === 'active_employers' ? activeEmployerAds : activeTab === 'cancellations' ? cancellations : archivedAds).map((ad, idx) => (
              <motion.div
                layout
                key={ad.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm transition-all flex flex-col group ${
                  ad.cancellation_requested ? 'border-orange-200 ring-2 ring-orange-100' : 
                  ad.status === 'archived' ? 'border-slate-200 opacity-80' :
                  ad.is_active ? 'border-slate-100' : 'border-slate-200'
                }`}
              >
                <div className="relative h-56 bg-slate-50 overflow-hidden">
                  {ad.media_type === 'video' ? (
                    <video src={ad.media_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" muted loop playsInline onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => e.currentTarget.pause()} />
                  ) : (
                    <Image src={ad.media_url} alt={ad.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                  )}
                  
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="bg-black/50 backdrop-blur-md text-white p-2 rounded-xl">
                      {ad.media_type === 'video' ? <VideoIcon className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    </div>
                  </div>

                  {ad.cancellation_requested && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-xl text-[10px] font-black shadow-lg">
                        <Ban className="h-3.5 w-3.5" />
                        طلب إلغاء
                      </div>
                    </div>
                  )}

                  {ad.status === 'archived' && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500 text-white rounded-xl text-[10px] font-black shadow-lg">
                        <History className="h-3.5 w-3.5" />
                        مؤرشف
                      </div>
                    </div>
                  )}

                  {activeTab === 'system' && (
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button 
                        onClick={() => moveOrder(idx, 'up', systemAds)}
                        disabled={idx === 0}
                        className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-slate-600 hover:text-brand-600 disabled:opacity-30 shadow-sm"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => moveOrder(idx, 'down', systemAds)}
                        disabled={idx === systemAds.length - 1}
                        className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-slate-600 hover:text-brand-600 disabled:opacity-30 shadow-sm"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-grow space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow min-w-0">
                      <h3 className="font-black text-slate-900 truncate">{ad.title}</h3>
                      {ad.created_by && (
                        <p className="text-[10px] font-black text-brand-600 uppercase mt-1">بواسطة: {ad.employers?.company_name || ad.profiles?.full_name}</p>
                      )}
                      {ad.link_url && (
                        <a href={ad.link_url} target="_blank" className="text-xs text-brand-600 hover:underline flex items-center gap-1.5 mt-2 font-bold">
                          <ExternalLink className="h-3.5 w-3.5" />
                          رابط التوجيه
                        </a>
                      )}
                    </div>
                    {activeTab === 'system' && (
                      <button 
                        onClick={() => toggleStatus(ad)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                          ad.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}
                      >
                        {ad.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        {ad.is_active ? 'نشط' : 'معطل'}
                      </button>
                    )}
                  </div>

                  {ad.end_date && ad.status === 'approved' && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-xl">
                      <Clock className="h-3.5 w-3.5 text-brand-500" />
                      ينتهي في: {new Date(ad.end_date).toLocaleDateString('ar-EG')}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(ad.created_at).toLocaleDateString('ar-EG')}</p>
                    
                    <div className="flex gap-2">
                      {activeTab === 'requests' && (
                        <button 
                          onClick={() => { setSelectedAd(ad); setApprovalModal({ ...approvalModal, open: true }); }}
                          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-black hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                        >
                          مراجعة الطلب
                        </button>
                      )}
                      {activeTab === 'cancellations' && (
                        <>
                          <button 
                            onClick={() => approveCancellation(ad)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-black hover:bg-orange-600 transition-all"
                          >
                            قبول الإلغاء
                          </button>
                          <button 
                            onClick={() => rejectCancellation(ad)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
                          >
                            رفض
                          </button>
                        </>
                      )}
                      {activeTab === 'archived' && (
                        <button 
                          onClick={() => republishAd(ad)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-black hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          إعادة نشر
                        </button>
                      )}
                      <button 
                        onClick={() => deleteAd(ad)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Approval Modal */}
      <AnimatePresence>
        {approvalModal.open && selectedAd && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">مراجعة طلب الإعلان</h3>
                <button onClick={() => setApprovalModal({ ...approvalModal, open: false })} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  <X className="h-7 w-7" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="relative aspect-[3/1] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                    {selectedAd.media_type === 'video' ? (
                      <video src={selectedAd.media_url} className="w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                      <Image src={selectedAd.media_url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">العنوان</p>
                    <p className="font-black text-slate-900">{selectedAd.title}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-4">بواسطة</p>
                    <p className="font-bold text-brand-600">{selectedAd.employers?.company_name || selectedAd.profiles?.full_name}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-black text-slate-700">مدة الإعلان (أيام) *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[7, 30, 90].map(d => (
                        <button
                          key={d}
                          onClick={() => setApprovalModal({ ...approvalModal, duration: d })}
                          className={`py-3 rounded-xl text-xs font-black border transition-all ${
                            approvalModal.duration === d ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          {d === 7 ? 'أسبوع' : d === 30 ? 'شهر' : '3 أشهر'}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="number" 
                      value={approvalModal.duration}
                      onChange={(e) => setApprovalModal({ ...approvalModal, duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-500/20 font-bold mt-2"
                      placeholder="أو ادخل عدد الأيام..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-black text-slate-700">سبب الرفض (في حال الرفض)</label>
                    <textarea 
                      value={approvalModal.rejectionReason}
                      onChange={(e) => setApprovalModal({ ...approvalModal, rejectionReason: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-500/20 font-bold resize-none h-24 text-sm"
                      placeholder="لماذا تم رفض الطلب؟ سيتم عرضه للمنشأة..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8 mt-8 border-t border-slate-50">
                <button
                  onClick={approveAd}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black shadow-xl shadow-brand-100 hover:bg-brand-700 transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  قبول ونشر الإعلان
                </button>
                <button
                  onClick={rejectAd}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                >
                  <XCircle className="h-5 w-5" />
                  رفض الطلب
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Ad Modal (for System Ads) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">إضافة إعلان نظام</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  <X className="h-7 w-7" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-black text-slate-700">الملف الإعلاني *</label>
                  <div className="relative">
                    {newAd.media_url ? (
                      <div className="relative h-64 w-full rounded-2xl overflow-hidden group">
                        {newAd.media_type === 'video' ? (
                          <video src={newAd.media_url} className="w-full h-full object-cover" muted autoPlay loop />
                        ) : (
                          <Image src={newAd.media_url} alt="Preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
                        )}
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="h-8 w-8 text-white" />
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-64 w-full border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all group">
                        <Upload className="h-10 w-10 text-slate-300 group-hover:text-brand-500 mb-2" />
                        <span className="text-sm text-slate-500 font-bold">ارفع صورة أو فيديو</span>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                      </label>
                    )}
                    {uploadProgress > 0 && (
                      <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <input
                    required
                    type="text"
                    value={newAd.title}
                    onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500/20 font-black"
                    placeholder="عنوان الإعلان"
                  />
                  <input
                    type="url"
                    value={newAd.link_url}
                    onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500/20 font-bold"
                    placeholder="رابط التوجيه (اختياري)"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newAd.media_url}
                    className="flex-1 py-5 bg-brand-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'نشر الإعلان'}
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

