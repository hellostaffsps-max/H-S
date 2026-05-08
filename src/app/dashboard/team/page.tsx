"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Star,
  Award,
  ArrowLeft,
  X,
  Loader2,
  Search,
  UserX,
  MessageSquare,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getTeamMembers, terminateEmployee } from "@/app/actions/team";

export default function TeamPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile?.role === "employer") {
      fetchTeam();
    }
  }, [user, profile]);

  async function fetchTeam() {
    setLoading(true);
    const result = await getTeamMembers();
    if (result.success) {
      setTeamMembers(result.data || []);
      setCompanyName(result.companyName || "");
    }
    setLoading(false);
  }

  async function handleTerminate() {
    if (!terminatingId) return;
    setActionLoading(true);
    const result = await terminateEmployee(terminatingId, terminateReason || undefined);
    if (result.success) {
      setTeamMembers((prev) => prev.filter((m) => m.id !== terminatingId));
      setSuccess("تم إنهاء عمل الموظف بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "فشل إنهاء عمل الموظف");
      setTimeout(() => setError(null), 3000);
    }
    setShowTerminateModal(false);
    setTerminatingId(null);
    setTerminateReason("");
    setSelectedMember(null);
    setActionLoading(false);
  }

  // Filter
  const filtered = teamMembers.filter((m) => {
    const name = m.seekers?.profiles?.full_name || "";
    const jobTitle = m.jobs?.title || "";
    const seekerTitle = m.seekers?.job_title || "";
    const term = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(term) ||
      jobTitle.toLowerCase().includes(term) ||
      seekerTitle.toLowerCase().includes(term)
    );
  });

  // Group by job title
  const grouped = filtered.reduce((acc: Record<string, any[]>, member) => {
    const jobTitle = member.jobs?.title || "غير محدد";
    if (!acc[jobTitle]) acc[jobTitle] = [];
    acc[jobTitle].push(member);
    return acc;
  }, {});

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (profile?.role !== "employer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">هذه الصفحة مخصصة لأصحاب المنشآت فقط</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                فريق العمل
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {companyName} • {teamMembers.length} موظف
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن موظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
              />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-bold flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{teamMembers.length}</p>
                <p className="text-xs text-slate-500 font-bold">إجمالي الموظفين</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{Object.keys(grouped).length}</p>
                <p className="text-xs text-slate-500 font-bold">مسميات وظيفية</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{filtered.length}</p>
                <p className="text-xs text-slate-500 font-bold">نتائج البحث</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {teamMembers.length === 0 && (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">لا يوجد موظفين حالياً</h3>
            <p className="text-sm text-slate-500 mb-6">
              عند قبول طلبات التوظيف ستظهر بيانات الموظفين هنا
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للوحة التحكم
            </Link>
          </div>
        )}

        {/* Team Grid - Grouped by Job Title */}
        {Object.entries(grouped).map(([jobTitle, members]) => (
          <div key={jobTitle} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-brand-600" />
              </div>
              <h2 className="text-lg font-black text-slate-900">{jobTitle}</h2>
              <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full border border-brand-100">
                {members.length} موظف
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member: any) => {
                const profile = member.seekers?.profiles;
                const fullName = profile?.full_name || "موظف";
                const initial = fullName.charAt(0);
                const avatarUrl = profile?.avatar_url;

                return (
                  <div
                    key={member.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* Card Header */}
                    <div className="h-16 bg-gradient-to-l from-brand-500 to-brand-600 relative">
                      <div className="absolute -bottom-6 right-4">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={fullName}
                            className="w-14 h-14 rounded-xl border-3 border-white object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl border-3 border-white bg-brand-100 flex items-center justify-center text-brand-700 text-lg font-black shadow-sm">
                            {initial}
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                          {new Date(member.created_at).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="pt-8 pb-4 px-4">
                      <h3 className="text-base font-bold text-slate-900 truncate">{fullName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {member.seekers?.job_title || "—"}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500">
                        {profile?.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {profile.location}
                          </span>
                        )}
                        {member.seekers?.experience_years != null && (
                          <span className="inline-flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {member.seekers.experience_years} سنة
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {member.seekers?.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {member.seekers.skills.slice(0, 3).map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {member.seekers.skills.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-bold px-1">
                              +{member.seekers.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-bold hover:bg-brand-100 transition-colors border border-brand-100"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          التفاصيل
                        </button>
                        <Link
                          href={`/messages?with=${member.seeker_id}`}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setTerminatingId(member.id);
                            setShowTerminateModal(true);
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
                          title="إنهاء العمل"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Member Detail Modal */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10">
                <h2 className="text-lg font-black text-slate-900">بطاقة الموظف</h2>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {(() => {
                  const mp = selectedMember.seekers?.profiles;
                  const ms = selectedMember.seekers;
                  const name = mp?.full_name || "موظف";
                  return (
                    <>
                      {/* Profile */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-black shrink-0">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                          <p className="text-sm text-slate-500">{ms?.job_title || "—"}</p>
                          <p className="text-xs text-brand-600 font-bold mt-0.5">
                            الوظيفة: {selectedMember.jobs?.title}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        يعمل حالياً في {selectedMember.jobs?.company_name || companyName}
                      </div>

                      {/* Contact */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mp?.phone && (
                          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                            <Phone className="w-4 h-4 text-brand-600" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold">الهاتف</p>
                              <p className="text-sm font-bold text-slate-900" dir="ltr">{mp.phone}</p>
                            </div>
                          </div>
                        )}
                        {mp?.email && (
                          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                            <Mail className="w-4 h-4 text-brand-600" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold">البريد</p>
                              <p className="text-sm font-bold text-slate-900 truncate" dir="ltr">{mp.email}</p>
                            </div>
                          </div>
                        )}
                        {mp?.location && (
                          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                            <MapPin className="w-4 h-4 text-brand-600" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold">الموقع</p>
                              <p className="text-sm font-bold text-slate-900">{mp.location}</p>
                            </div>
                          </div>
                        )}
                        {ms?.experience_years != null && (
                          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                            <Award className="w-4 h-4 text-brand-600" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold">الخبرة</p>
                              <p className="text-sm font-bold text-slate-900">{ms.experience_years} سنة</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {ms?.skills?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">المهارات</h4>
                          <div className="flex flex-wrap gap-2">
                            {ms.skills.map((skill: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resume */}
                      {(ms?.cv_url || (ms?.resume_data && Object.keys(ms.resume_data).length > 0)) && (
                        <div className="flex flex-wrap gap-2">
                          {ms?.resume_data && Object.keys(ms.resume_data).length > 0 && (
                            <a
                              href={`/cv-builder?view=${selectedMember.seeker_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              عرض السيرة الذاتية
                            </a>
                          )}
                        </div>
                      )}

                      {/* Hire date */}
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">تاريخ التوظيف</p>
                        <p className="text-sm font-bold text-slate-900">
                          {new Date(selectedMember.created_at).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Link
                          href={`/messages?with=${selectedMember.seeker_id}`}
                          onClick={() => setSelectedMember(null)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 border border-emerald-200"
                        >
                          <MessageSquare className="w-4 h-4" />
                          مراسلة
                        </Link>
                        <button
                          onClick={() => {
                            setTerminatingId(selectedMember.id);
                            setShowTerminateModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 border border-red-200"
                        >
                          <UserX className="w-4 h-4" />
                          إنهاء العمل
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Terminate Confirmation Modal */}
        {showTerminateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setShowTerminateModal(false); setTerminatingId(null); }} />
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">إنهاء عمل الموظف</h3>
                  <p className="text-xs text-slate-500">سيتم تغيير حالة الموظف إلى "متاح للعمل"</p>
                </div>
              </div>
              <div className="p-5">
                <label className="block text-sm font-bold text-slate-700 mb-2 text-right">
                  سبب إنهاء العمل <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <textarea
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-right resize-none"
                  placeholder="مثال: انتهاء فترة العقد، تغيير متطلبات العمل..."
                  autoFocus
                />
              </div>
              <div className="p-5 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  onClick={() => { setShowTerminateModal(false); setTerminatingId(null); setTerminateReason(""); }}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                  disabled={actionLoading}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleTerminate}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-70 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  تأكيد إنهاء العمل
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
