"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Plus, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  cover_image: string | null;
  created_at: string;
};

export default function EmployerArticles() {
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    if (!profile) return;
    
    try {
      // 1. Fetch active subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(max_articles_per_month)')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .limit(1)
        .single();
        
      setSubscription(subData);

      // 2. Fetch all user's articles
      const { data: articlesData } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false });
        
      setArticles(articlesData || []);

      // 3. Calculate this month's usage (pending or published)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id)
        .neq('status', 'rejected')
        .gte('created_at', firstDayOfMonth);
        
      setMonthlyUsage(count || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article_images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error.message);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title || !content) return;

    setSubmitting(true);
    try {
      // Generate a basic slug
      const slug = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now();

      const { data, error } = await supabase
        .from('articles')
        .insert({
          author_id: profile.id,
          title,
          slug,
          content,
          excerpt: content.substring(0, 150),
          cover_image: imageUrl || null,
          status: 'pending_approval'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setArticles([data, ...articles]);
      setMonthlyUsage(prev => prev + 1);
      
      // Reset form
      setIsWriting(false);
      setTitle('');
      setContent('');
      setImageUrl('');
      
      alert('تم إرسال المقال بنجاح! وهو الآن بانتظار مراجعة الإدارة.');
    } catch (error: any) {
      console.error('Error submitting article:', error.message);
      alert('حدث خطأ أثناء إرسال المقال.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const maxArticles = subscription?.subscription_plans?.max_articles_per_month || 0;
  const canPublish = subscription && monthlyUsage < maxArticles;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">إدارة مقالاتي الإعلانية</h2>
            <p className="text-slate-500 text-sm">اكتب وانشر مقالات ترويجية لشركتك على المنصة</p>
          </div>
        </div>
        
        {!isWriting && (
          <button 
            onClick={() => setIsWriting(true)}
            disabled={!canPublish}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canPublish ? <Plus className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            اكتب مقالاً جديداً
          </button>
        )}
      </div>

      {/* Subscription Status Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {subscription ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          <span className="font-medium text-slate-700">
            {subscription ? 'اشتراكك فعال' : 'ليس لديك اشتراك فعال للقدرة على نشر المقالات'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-500">استهلاك هذا الشهر: </span>
            <span className="font-bold text-slate-900">{monthlyUsage} / {maxArticles} مقال</span>
          </div>
          {!subscription && (
            <Link href="/pricing" className="text-sm font-bold text-brand-600 hover:underline">
              ترقية الحساب &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Write Article Form */}
      {isWriting && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-900">مقال جديد</h3>
            <button onClick={() => setIsWriting(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700">إلغاء</button>
          </div>
          <form onSubmit={handleSubmitArticle} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان المقال</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان يجذب القراء..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">صورة المقال (اختياري)</label>
              {imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden h-48 w-full md:w-64 border border-slate-200">
                  <img src={imageUrl} alt="Article cover" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-white/90 text-red-600 px-2 py-1 rounded text-xs font-bold shadow-sm">إزالة</button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-brand-300 transition-colors">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
                    <span className="text-sm font-medium text-slate-600">{uploading ? 'جاري الرفع...' : 'اختر صورة'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">محتوى المقال</label>
              <textarea
                required
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب محتوى مقالك هنا..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                إرسال للمراجعة
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Previous Articles List */}
      <div className="space-y-4">
        <h3 className="font-black text-xl text-slate-900 mb-6">سجل مقالاتك</h3>
        
        {articles.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-100">
            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">لم تقم بكتابة أي مقالات حتى الآن</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                {article.cover_image && (
                  <div className="h-40 overflow-hidden bg-slate-100">
                    <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      article.status === 'published' ? 'bg-green-100 text-green-700' :
                      article.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {article.status === 'published' ? 'تم النشر' :
                       article.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(article.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2">{article.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-3">{article.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
