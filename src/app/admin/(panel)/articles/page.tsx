"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Eye,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Edit,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import Image from "next/image";
import Pagination from '@/components/Pagination';
import { useToast } from "@/hooks/useToast";

type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  cover_image: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  };
};

export default function AdminArticles() {
  const { showToast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);

  const [newArticle, setNewArticle] = useState({
    id: '',
    title: '',
    content: '',
    excerpt: '',
    cover_image: '',
    status: 'published'
  });

  useEffect(() => {
    fetchArticles();
  }, [page]);

  async function fetchArticles() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/articles?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch articles');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch articles');
      setArticles(json.data);
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages);
        setHasNext(json.pagination.hasNext);
        setHasPrev(json.pagination.hasPrev);
        setTotal(json.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: 'published' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update article');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to update article');

      setArticles(arts => arts.map(art => 
        art.id === id ? json.data : art
      ));
    } catch (error) {
      console.error('Error updating article status:', error);
      showToast('حدث خطأ أثناء تحديث حالة المقال', "error");
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEditing = !!newArticle.id;
    const url = isEditing ? `/api/admin/articles/${newArticle.id}` : '/api/admin/articles';
    const method = isEditing ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newArticle.title,
          content: newArticle.content,
          excerpt: newArticle.excerpt || undefined,
          cover_image: newArticle.cover_image || undefined,
          status: newArticle.status,
        }),
      });
      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} article`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || `Failed to ${isEditing ? 'update' : 'create'} article`);

      if (isEditing) {
        setArticles(arts => arts.map(art => art.id === newArticle.id ? json.data : art));
        showToast('تم تعديل المقال بنجاح', "success");
      } else {
        setArticles([json.data, ...articles]);
        showToast('تم إنشاء المقال بنجاح', "success");
      }
      setIsModalOpen(false);
      setNewArticle({ id: '', title: '', content: '', excerpt: '', cover_image: '', status: 'published' });
    } catch (error: any) {
      console.error('Error saving article:', error);
      showToast('حدث خطأ أثناء الحفظ: ' + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewModal = () => {
    setNewArticle({ id: '', title: '', content: '', excerpt: '', cover_image: '', status: 'published' });
    setIsModalOpen(true);
  };

  const openEditModal = (article: Article) => {
    setNewArticle({
      id: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      cover_image: article.cover_image || '',
      status: article.status
    });
    setIsModalOpen(true);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete article');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to delete article');

      setArticles(arts => arts.filter(art => art.id !== id));
      showToast('تم حذف المقال بنجاح', "success");
    } catch (error: any) {
      console.error('Error deleting article:', error);
      showToast('حدث خطأ أثناء حذف المقال: ' + error.message, "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `article_covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('platform_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('platform_assets')
        .getPublicUrl(filePath);

      setNewArticle({ ...newArticle, cover_image: publicUrl });
    } catch (error: any) {
      console.error('Error uploading image:', error.message);
      showToast('فشل رفع الصورة', "error");
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesFilter = filter === 'all' || art.status === filter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      art.title.toLowerCase().includes(searchLower) ||
      art.profiles?.full_name?.toLowerCase().includes(searchLower);
    
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">إدارة المقالات والمدونة</h2>
            <p className="text-slate-500 text-sm">مراجعة المنشورات الإعلانية لأصحاب العمل ونشر مقالات المنصة</p>
          </div>
        </div>
        
        <button 
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all"
        >
          <Plus className="h-5 w-5" />
          مقال جديد (أدمن)
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex gap-2 w-full md:w-auto">
            {['all', 'pending_approval', 'published'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex-1 md:flex-none ${
                  filter === f 
                    ? 'bg-amber-500 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'الكل' : f === 'pending_approval' ? 'بانتظار المراجعة' : 'منشور'}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بعنوان المقال أو الكاتب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center p-12">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">لا توجد مقالات لعرضها</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {articles.map((article) => (
                <div key={article.id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                  {article.cover_image ? (
                    <div className="h-32 overflow-hidden bg-slate-100 relative">
                      <Image src={article.cover_image} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw" />
                    </div>
                  ) : (
                    <div className="h-32 bg-slate-50 flex items-center justify-center relative">
                      <FileText className="h-12 w-12 text-slate-200" />
                    </div>
                  )}
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        article.status === 'published' ? 'bg-green-100 text-green-700' :
                        article.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {article.status === 'published' ? 'منشور' :
                         article.status === 'rejected' ? 'مرفوض' : 'بانتظار المراجعة'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(article.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-grow">{article.content}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                          {article.profiles?.full_name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">
                          {article.profiles?.full_name}
                        </span>
                        {article.profiles?.role === 'admin' && (
                          <span className="bg-brand-50 text-brand-600 text-[8px] px-1.5 py-0.5 rounded-sm font-bold">إدارة</span>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Link href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="عرض التفاصيل">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => openEditModal(article)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                          title="تعديل المقال"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="حذف المقال"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {article.status === 'pending_approval' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(article.id, 'published')}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                              title="موافقة ونشر"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(article.id, 'rejected')}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                              title="رفض المقال"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Create Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-100 my-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">{newArticle.id ? 'تعديل المقال' : 'إنشاء مقال جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-6">
              {/* Cover Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">صورة الغلاف</label>
                <div className="relative group">
                  {newArticle.cover_image ? (
                    <div className="h-48 w-full rounded-2xl overflow-hidden relative">
                      <Image src={newArticle.cover_image} alt="Cover preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <label className="cursor-pointer p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
                          <Upload className="h-6 w-6" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-brand-400 hover:bg-slate-50 transition-all">
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                        <span className="text-sm text-slate-500 font-bold">اضغط لرفع صورة الغلاف</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">عنوان المقال</label>
                  <input
                    required
                    type="text"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold"
                    placeholder="أدخل عنوان المقال الجذاب..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">وصف مختصر</label>
                  <textarea
                    rows={2}
                    value={newArticle.excerpt}
                    onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="نبذة بسيطة تظهر في قائمة المقالات..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">محتوى المقال</label>
                  <textarea
                    required
                    rows={8}
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
                    placeholder="اكتب محتوى المقال هنا بالتفصيل..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">حالة النشر</label>
                  <select
                    value={newArticle.status}
                    onChange={(e) => setNewArticle({ ...newArticle, status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold"
                  >
                    <option value="published">نشر فوري</option>
                    <option value="pending_approval">مسودة (للمراجعة لاحقاً)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ ونشر المقال'}
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
    </motion.div>
  );
}
