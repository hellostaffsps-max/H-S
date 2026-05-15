"use client";
import { useState } from "react";
import { Pencil, CheckCircle2, FileText, Save, Loader2, MapPin, Phone, X, Trophy } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { updateProfile, updateSeekerProfile } from "@/app/actions/profile";
import { submitContactForm } from "@/app/actions/contact";
import Link from "next/link";
import { PALESTINIAN_CITIES, getSuggestedKeywords } from "@/lib/profile-utils";

interface SeekerProfileProps {
  profile: any;
  user: any;
  seekerData: any;
  onSeekerDataUpdate: (data: any) => void;
  onProfileUpdate?: () => Promise<void>;
}

export default function SeekerProfile({ profile, user, seekerData, onSeekerDataUpdate, onProfileUpdate }: SeekerProfileProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Status Change Modal States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [employerName, setEmployerName] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // States for new features
  const isPalestinianCity = profile?.location && PALESTINIAN_CITIES.includes(profile.location);
  const [selectedLocation, setSelectedLocation] = useState(isPalestinianCity ? profile.location : (profile?.location ? "أخرى" : ""));
  const [customLocation, setCustomLocation] = useState(!isPalestinianCity ? (profile?.location || "") : "");
  
  const [currentJobTitle, setCurrentJobTitle] = useState(seekerData?.job_title || "");
  const suggestedKeywords = getSuggestedKeywords(currentJobTitle);

  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvUrl, setCvUrl] = useState(seekerData?.cv_url || null);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("حجم الملف يتجاوز 3 ميجابايت");
      return;
    }
    if (file.type !== "application/pdf") {
      alert("يرجى رفع ملف PDF فقط");
      return;
    }
    
    setUploadingCV(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: signedData, error: signedError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 3600);
      
      if (signedError || !signedData) throw signedError;
      
      setCvUrl(signedData.signedUrl);
      await supabase.from("seekers").update({ cv_url: filePath }).eq("profile_id", user.id);
      onSeekerDataUpdate({ ...seekerData, cv_url: filePath });
      alert("تم رفع السيرة الذاتية بنجاح!");
    } catch (err) {
      console.error("Error uploading CV:", err);
      alert("حدث خطأ أثناء رفع السيرة الذاتية");
    } finally {
      setUploadingCV(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    setAvatarUrl(url);
    if (isSupabaseConfigured && user) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const [profileResult, seekerResult] = await Promise.all([
      updateProfile(formData),
      updateSeekerProfile(formData),
    ]);

    if (profileResult.success || seekerResult.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setIsEditing(false);
      if (user) {
        const { data } = await supabase
          .from("seekers")
          .select("*")
          .eq("profile_id", user.id)
          .single();
        onSeekerDataUpdate(data);
      }
      // Refresh profile data (phone, location) in parent
      if (onProfileUpdate) {
        await onProfileUpdate();
      }
    } else {
      setError(profileResult.error || seekerResult.error || "حدث خطأ");
    }

    setLoading(false);
  }

  const handleStatusChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerName.trim()) return;
    setSubmittingStatus(true);
    
    const formData = new FormData();
    formData.append("name", profile?.full_name || "مستخدم");
    formData.append("email", user?.email || "");
    formData.append("subject", `[طلب تغيير حالة] ${employerName.trim()}`);
    formData.append("message", `أرجو تغيير حالتي إلى يعمل في: ${employerName.trim()}\n\nتم إرسال هذا الطلب من الملف الشخصي.`);
    
    const res = await submitContactForm(formData);
    if (res.success) {
      alert("تم إرسال الطلب بنجاح للإدارة وسيتم مراجعته.");
      setShowStatusModal(false);
      setEmployerName("");
    } else {
      alert(res.error || "حدث خطأ أثناء الإرسال");
    }
    setSubmittingStatus(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <div className="h-24 sm:h-32 bg-brand-100 w-full relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-600 to-transparent" />
        </div>
        <div className="px-4 sm:px-6 pb-6 pt-4 relative flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
          <div className="flex items-center gap-4 absolute -top-12 sm:static w-full sm:w-auto justify-center sm:mx-auto">
            <AvatarUpload
              currentUrl={avatarUrl}
              onUpload={handleAvatarUpload}
              fallbackInitial={(profile?.full_name || "h")[0]}
            />
            <div className="pt-12 sm:pt-0 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {profile?.full_name || "مرحباً"}
              </h1>
              {seekerData?.is_featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold shadow-sm w-fit">
                  <Trophy className="h-3.5 w-3.5 text-amber-600" />
                  {"موظف مميز"}
                </span>
              )}
              <p className="text-slate-500 text-sm">
                {seekerData?.job_title || "أضف مسماك الوظيفي"}
              </p>
            </div>
          </div>

          <div className="mt-16 sm:mt-0 flex flex-col items-center gap-2 relative z-10">
            <div className={`w-full sm:w-auto ${seekerData?.is_available !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'} border px-3 py-1.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5`}>
              <CheckCircle2 className="w-4 h-4" />
              {seekerData?.is_available !== false
                ? "متاح للعمل"
                : seekerData?.current_employer
                  ? `يعمل حالياً في ${seekerData.current_employer}`
                  : "غير متاح حالياً"
              }
            </div>
            {seekerData?.is_available !== false && (
              <button 
                onClick={() => setShowStatusModal(true)} 
                className="text-xs text-slate-500 hover:text-brand-600 underline decoration-slate-300 hover:decoration-brand-600 transition-colors bg-white/50 px-2 py-1 rounded"
              >
                تحديث حالة التوظيف
              </button>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-wrap gap-3">
          <Link
            href="/cv-builder"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm hover:bg-brand-100 transition-colors font-bold"
          >
            <FileText className="w-4 h-4" /> منشئ السيرة الذاتية
          </Link>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              id="cv-upload" 
              onChange={handleCVUpload}
              disabled={uploadingCV}
            />
            <label 
              htmlFor="cv-upload"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm hover:bg-indigo-100 transition-colors font-bold cursor-pointer"
            >
              {uploadingCV ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {cvUrl ? "تحديث الـ CV (PDF)" : "رفع الـ CV (PDF)"}
            </label>
            {cvUrl && (
              <a href={cvUrl.startsWith('http') ? cvUrl : `/api/cv?path=${encodeURIComponent(cvUrl)}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold hover:underline">
                عرض الـ CV المرفوع
              </a>
            )}
          </div>
          <Link
            href={`/messages?with=${user.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm hover:bg-slate-100 transition-colors font-bold"
          >
            <MessageIcon /> الرسائل
          </Link>
        </div>
      </div>

      {/* Content Form / View */}
      {!isEditing ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 w-full justify-between">
              <h2 className="text-lg font-black text-slate-900 text-right">البيانات الشخصية</h2>
              <div className="flex items-center gap-3">
                {success && (
                  <span className="text-green-600 text-sm font-bold flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> تم الحفظ
                  </span>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  تعديل
                </button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 text-right">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">الاسم الكامل</p>
              <p className="font-semibold text-slate-900">{profile?.full_name || "غير محدد"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">رقم الهاتف</p>
              <p className="font-semibold text-slate-900" dir="ltr">{profile?.phone || "غير محدد"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">البريد الإلكتروني</p>
              <p className="font-semibold text-slate-900 break-all" dir="ltr">{user?.email || "غير محدد"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">الموقع</p>
              <p className="font-semibold text-slate-900">{profile?.location || "غير محدد"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">المسمى الوظيفي</p>
              <p className="font-semibold text-slate-900">{seekerData?.job_title || "غير محدد"}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">سنوات الخبرة</p>
              <p className="font-semibold text-slate-900">{seekerData?.experience_years ?? 0} سنوات</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">المهارات</p>
              <div className="flex flex-wrap gap-2">
                {(seekerData?.skills || []).map((skill: string, idx: number) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                    {skill}
                  </span>
                ))}
                {(!seekerData?.skills || seekerData.skills.length === 0) && (
                  <p className="text-sm text-slate-400">لم يتم تحديد مهارات بعد.</p>
                )}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">نبذة عنك</p>
              <p className="font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {seekerData?.bio || "لا توجد نبذة حالياً."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 w-full text-right">
              تعديل البيانات الشخصية
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
                الاسم الكامل
              </label>
              <input
                name="full_name"
                type="text"
                defaultValue={profile?.full_name || ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile?.phone || ""}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                  placeholder="+970 5xx xxx xxx"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
                الموقع
              </label>
              <div className="relative mb-2">
                <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right appearance-none"
                >
                  <option value="" disabled>اختر المدينة...</option>
                  {PALESTINIAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {selectedLocation === "أخرى" && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right mt-2"
                  placeholder="اكتب اسم المدينة أو المنطقة..."
                />
              )}
              <input type="hidden" name="location" value={selectedLocation === "أخرى" ? customLocation : selectedLocation} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
                المسمى الوظيفي
              </label>
              <input
                name="job_title"
                type="text"
                value={currentJobTitle}
                onChange={(e) => setCurrentJobTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                placeholder="نادل، طاهي، باريستا..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
                سنوات الخبرة
              </label>
              <input
                name="experience_years"
                type="number"
                min={0}
                defaultValue={seekerData?.experience_years ?? ""}
                className="w-full sm:w-1/2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                placeholder="0"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
                المهارات والكلمات المفتاحية (اضغط لاختيار المهارات المقترحة أو اكتب واضغط Enter للإضافة)
              </label>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {suggestedKeywords.map(skill => {
                  const isSelected = (seekerData?.skills || []).includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          const newSkills = (seekerData.skills || []).filter((s: string) => s !== skill);
                          onSeekerDataUpdate({ ...seekerData, skills: newSkills });
                        } else {
                          onSeekerDataUpdate({
                            ...seekerData,
                            skills: [...(seekerData?.skills || []), skill]
                          });
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700'}`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[50px]">
                {(seekerData?.skills || []).map((skill: string, idx: number) => (
                  <span key={idx} className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => {
                        const newSkills = (seekerData.skills || []).filter((_: any, i: number) => i !== idx);
                        onSeekerDataUpdate({ ...seekerData, skills: newSkills });
                      }}
                      className="hover:text-brand-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {(!seekerData?.skills || seekerData.skills.length === 0) && (
                  <span className="text-slate-400 text-xs py-1">لا توجد مهارات مضافة</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="skill-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val && !(seekerData?.skills || []).includes(val)) {
                        onSeekerDataUpdate({
                          ...seekerData,
                          skills: [...(seekerData?.skills || []), val]
                        });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                  placeholder="مثال: خدمة عملاء، طبخ، باريستا..."
                />
                <input type="hidden" name="skills" value={(seekerData?.skills || []).join(',')} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
                نبذة عنك
              </label>
              <textarea
                name="bio"
                rows={3}
                defaultValue={seekerData?.bio || ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right resize-none"
                placeholder="اكتب نبذة قصيرة عن خبراتك ومهاراتك..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ التغييرات
            </button>
          </div>
        </form>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-900">تحديث حالة التوظيف</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              تغيير الحالة إلى "يعمل في" يتطلب موافقة الإدارة، وذلك لربط التحديث بالمنشأة التي تم قبولك فيها. يرجى إدخال اسم المنشأة أدناه لتقديم الطلب.
            </p>
            <form onSubmit={handleStatusChangeRequest}>
              <div className="mb-5 text-right">
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المنشأة / مكان العمل</label>
                <input
                  type="text"
                  required
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                  placeholder="مثال: مطعم ستايل، فندق الساحل..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submittingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}
