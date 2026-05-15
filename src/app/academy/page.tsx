"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Lock, ShieldCheck, Download, PlayCircle, Loader2, Award, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

type Course = {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  file_url: string;
  type: string;
  created_at: string;
};

export default function AcademyPage() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }

      // Check verification status
      if (profile?.role === "seeker") {
        const { data: seeker } = await supabase
          .from("seekers")
          .select("verification_status")
          .eq("profile_id", user.id)
          .single();
        if (seeker?.verification_status === "verified") {
          setIsVerified(true);
        }
      }

      // Fetch courses
      const { data: coursesData } = await supabase
        .from("academy_courses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (coursesData) {
        setCourses(coursesData);
      }

      setLoading(false);
    }
    load();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
      </div>
    );
  }

  // Determine if content is locked
  const isLocked = profile?.role === "seeker" && !isVerified;

  const handleDownload = async (course: Course) => {
    if (isLocked) return;
    
    // Convert to signed URL if it's stored in our bucket
    if (!course.file_url.startsWith("http")) {
      const { data } = await supabase.storage
        .from("academy_files")
        .createSignedUrl(course.file_url, 60);
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } else {
      window.open(course.file_url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Section */}
      <div className="bg-slate-900 text-white py-16 sm:py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 blur-[120px] rounded-full -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/20 blur-[100px] rounded-full -ml-32 -mb-32" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <Award className="w-5 h-5 text-brand-400" />
            <span className="text-sm font-bold tracking-wide text-brand-100 uppercase">محتوى حصري</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">
            أكاديمية <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-400 to-emerald-400">Hello Staff</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            ارتقِ بمهاراتك واكتشف كورسات احترافية ووصفات حصرية معدة خصيصاً للمتميزين في سوق العمل.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        
        {/* Locked State Banner */}
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl border-2 border-brand-100 mb-12 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex-1 text-center md:text-right">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 mb-6">
                <Lock className="w-8 h-8 text-brand-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                المحتوى مقفل للموظفين الموثقين
              </h2>
              <p className="text-slate-600 text-lg mb-0 leading-relaxed max-w-2xl">
                بادر بتوثيق حسابك الآن لتتمكن من الوصول إلى جميع كورسات الأكاديمية وتحميل ملفات الوصفات الحصرية، بالإضافة إلى شارة التوثيق وبناء الـ CV مجاناً.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <Link 
                href="/profile" 
                className="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-5 bg-gradient-to-l from-brand-600 to-brand-500 text-white rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-brand-500/30 transition-all hover:-translate-y-1"
              >
                <ShieldCheck className="w-6 h-6" />
                طلب التوثيق الآن
              </Link>
            </div>
          </motion.div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">لا توجد كورسات حالياً</h3>
            <p className="text-slate-500 mt-2">سيتم إضافة محتوى الأكاديمية قريباً.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, idx) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm group ${isLocked ? 'pointer-events-none' : 'hover:shadow-xl hover:border-brand-200 transition-all cursor-pointer'}`}
                onClick={() => handleDownload(course)}
              >
                {/* Course Image */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {course.cover_image_url ? (
                    <img 
                      src={course.cover_image_url.startsWith('http') ? course.cover_image_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/academy_files/${course.cover_image_url}`} 
                      alt={course.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ${!isLocked && 'group-hover:scale-105'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <BookOpen className="w-16 h-16 text-slate-300" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-xs font-black text-slate-900 shadow-sm">
                      {course.type === 'course' ? 'كورس' : course.type === 'recipe' ? 'وصفة' : 'ملف'}
                    </span>
                  </div>

                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Hover Overlay for Download/Play */}
                  {!isLocked && (
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <div className="w-16 h-16 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                        {course.type === 'course' ? <PlayCircle className="w-8 h-8 ml-1" /> : <Download className="w-8 h-8" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6">
                    {course.description || "لا يوجد وصف."}
                  </p>
                  
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(course.created_at).toLocaleDateString('ar-EG')}
                    </span>
                    {!isLocked && (
                      <span className="text-sm font-bold text-brand-600 group-hover:text-brand-700 flex items-center gap-1">
                        {course.type === 'course' ? 'شاهد الكورس' : 'حمل الملف'}
                        <Sparkles className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
