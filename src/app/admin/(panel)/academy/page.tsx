"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BookOpen, Plus, Trash2, Edit2, Loader2, Save, Upload, 
  X, Image as ImageIcon, FileText, PlayCircle 
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

type Course = {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  file_url: string;
  type: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminAcademyPage() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("course");
  const [isActive, setIsActive] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState("");
  const [existingContentUrl, setExistingContentUrl] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    const { data } = await supabase
      .from("academy_courses")
      .select("id, title, description, cover_image_url, file_url, type, is_active, created_at")
      .order("created_at", { ascending: false });
    
    if (data) setCourses(data);
    setLoading(false);
  }

  function openModal(course?: Course) {
    if (course) {
      setEditId(course.id);
      setTitle(course.title);
      setDescription(course.description || "");
      setType(course.type);
      setIsActive(course.is_active);
      setExistingCoverUrl(course.cover_image_url || "");
      setExistingContentUrl(course.file_url || "");
    } else {
      setEditId(null);
      setTitle("");
      setDescription("");
      setType("course");
      setIsActive(true);
      setExistingCoverUrl("");
      setExistingContentUrl("");
    }
    setCoverFile(null);
    setContentFile(null);
    setIsModalOpen(true);
  }

  async function uploadFile(file: File, pathPrefix: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}_${Date.now()}.${fileExt}`;
    
    const { error, data } = await supabase.storage
      .from('academy_files')
      .upload(fileName, file);
      
    if (error) throw error;
    return data.path;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title || (!contentFile && !existingContentUrl)) {
      showToast("يرجى إدخال عنوان الكورس وملف المحتوى", "info");
      return;
    }

    setSaving(true);
    try {
      let finalCoverUrl = existingCoverUrl;
      let finalContentUrl = existingContentUrl;

      if (coverFile) {
        finalCoverUrl = await uploadFile(coverFile, 'cover');
      }
      
      if (contentFile) {
        finalContentUrl = await uploadFile(contentFile, 'content');
      }

      const payload = {
        title,
        description,
        type,
        is_active: isActive,
        cover_image_url: finalCoverUrl,
        file_url: finalContentUrl,
      };

      if (editId) {
        const { error } = await supabase
          .from("academy_courses")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("academy_courses")
          .insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المحتوى؟ لا يمكن التراجع عن هذه الخطوة.")) return;
    
    const { error } = await supabase
      .from("academy_courses")
      .delete()
      .eq("id", id);
      
    if (error) {
      showToast("حدث خطأ أثناء الحذف", "error");
    } else {
      fetchCourses();
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 sm:p-10 shadow-2xl flex justify-between items-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">إدارة الأكاديمية</h1>
            <p className="text-slate-400 text-sm font-medium">إضافة وإدارة الكورسات وملفات الـ PDF</p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="relative z-10 flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> إضافة محتوى جديد
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
          <p className="text-slate-400 font-bold">جاري تحميل الأكاديمية...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
          <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">لا توجد محتويات بعد</h3>
          <p className="text-slate-500 mb-6">قم بإضافة الكورس أو الوصفة الأولى الآن.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm group hover:shadow-xl transition-all">
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {course.cover_image_url ? (
                  <img 
                    src={course.cover_image_url.startsWith('http') ? course.cover_image_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/academy_files/${course.cover_image_url}`} 
                    className="w-full h-full object-cover" 
                    alt={course.title} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black rounded-full shadow-sm backdrop-blur-md",
                    course.is_active ? "bg-emerald-500/90 text-white" : "bg-slate-500/90 text-white"
                  )}>
                    {course.is_active ? "نشط" : "مخفي"}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{course.type === 'course' ? 'كورس' : course.type === 'recipe' ? 'وصفة' : 'ملف PDF'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openModal(course)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(course.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mt-2 h-10 leading-relaxed">
                  {course.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl my-8 overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-900">
                {editId ? "تعديل المحتوى" : "إضافة محتوى جديد"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-6 text-right">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">العنوان <span className="text-rose-500">*</span></label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="مثال: كورس إعداد القهوة" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">النوع</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="course">كورس (فيديو/دورة)</option>
                    <option value="recipe">وصفة (Recipe)</option>
                    <option value="document">مستند (PDF)</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">الوصف</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="نبذة عن الكورس أو الوصفة..." />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 text-right">
                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">صورة الغلاف</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors">
                    <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                    <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center">
                      <ImageIcon className="w-8 h-8 text-emerald-500 mb-2" />
                      <span className="text-sm font-bold text-slate-700">{coverFile ? coverFile.name : "اضغط لاختيار صورة"}</span>
                      {existingCoverUrl && !coverFile && <span className="text-xs text-emerald-600 mt-1">يوجد صورة مرفوعة مسبقاً</span>}
                    </label>
                  </div>
                </div>

                {/* Content File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">ملف المحتوى (PDF / Video) <span className="text-rose-500">*</span></label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors">
                    <input type="file" id="content-upload" accept=".pdf,video/mp4" className="hidden" onChange={e => setContentFile(e.target.files?.[0] || null)} />
                    <label htmlFor="content-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-8 h-8 text-brand-500 mb-2" />
                      <span className="text-sm font-bold text-slate-700">{contentFile ? contentFile.name : "اضغط لرفع الملف"}</span>
                      {existingContentUrl && !contentFile && <span className="text-xs text-brand-600 mt-1">يوجد ملف مرفوع مسبقاً</span>}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input type="checkbox" id="is-active" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                <label htmlFor="is-active" className="text-sm font-bold text-slate-700 cursor-pointer">
                  تفعيل المحتوى (مرئي للمستخدمين الموثقين)
                </label>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "جاري الحفظ والرفع..." : "حفظ المحتوى"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
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
