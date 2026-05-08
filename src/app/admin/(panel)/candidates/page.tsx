"use client";

import { useEffect, useState } from "react";
import { UserCircle, Search, Loader2, MapPin, Calendar, Briefcase, Star, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Seeker {
  profile_id: string;
  job_title: string | null;
  experience_years: number | null;
  skills: string[] | null;
  availability: string | null;
  bio: string | null;
  cv_url: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
}

export default function CandidatesManagement() {
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSeekers();
  }, []);

  async function fetchSeekers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("seekers")
        .select("*, profiles(full_name, email, phone, location, avatar_url, created_at)");

      if (error) throw error;
      
      const sorted = (data || []).sort((a, b) => {
        const d1 = new Date(a.profiles?.created_at || 0).getTime();
        const d2 = new Date(b.profiles?.created_at || 0).getTime();
        return d2 - d1;
      });
      
      setSeekers(sorted);
    } catch (e: any) {
      console.error("Error fetching seekers:", e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = seekers.filter((s) =>
    s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">المرشحون</h2>
          <p className="text-slate-500">إدارة حسابات الباحثين عن عمل</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100">
          <UserCircle className="h-4 w-4 text-brand-600" />
          <span className="font-bold">{seekers.length}</span> مرشح مسجل
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث بالاسم أو المسمى الوظيفي أو المهارة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">المرشح</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">المسمى الوظيفي</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الخبرة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">المهارات</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الحالة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    {searchTerm ? "لا توجد نتائج مطابقة" : "لا يوجد مرشحون مسجلون بعد"}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.profile_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0 overflow-hidden">
                          {s.profiles?.avatar_url ? (
                            <img src={s.profiles.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <UserCircle className="h-5 w-5 text-brand-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{s.profiles?.full_name || "بدون اسم"}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.profiles?.location || "غير محدد"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        {s.job_title || "غير محدد"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm text-slate-700">
                          {s.experience_years != null ? `${s.experience_years} سنوات` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {s.skills && s.skills.length > 0 ? (
                          <>
                            {s.skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                                {skill}
                              </span>
                            ))}
                            {s.skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded-md text-[10px] font-bold">
                                +{s.skills.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.availability === "available" || s.availability === "متاح" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                          <CheckCircle className="h-3 w-3" /> متاح
                        </span>
                      ) : s.availability === "not_available" || s.availability === "غير متاح" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                          <XCircle className="h-3 w-3" /> غير متاح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-bold">
                          غير محدد
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(s.profiles?.created_at || 0).toLocaleDateString("ar-EG")}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
