"use client";
import { useEffect, useState } from "react";
import { Search, MapPin, Briefcase, Star, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SeekerProfile {
  profile_id: string;
  job_title: string;
  bio: string;
  experience_years: number;
  skills: string[];
  is_available: boolean;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    location: string | null;
    phone: string | null;
  } | null;
}

export default function SearchResumes() {
  const [seekers, setSeekers] = useState<SeekerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetchSeekers();
  }, []);

  async function fetchSeekers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("seekers")
      .select(`
        profile_id,
        job_title,
        bio,
        experience_years,
        skills,
        is_available,
        profiles(full_name, avatar_url, location, phone)
      `)
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching seekers:", error);
    } else {
      const normalized = (data || []).map((item: any) => {
        const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        return {
          ...item,
          profiles: prof || null,
        };
      });
      setSeekers(normalized as SeekerProfile[]);
    }
    setLoading(false);
  }

  const categories = [
    { value: "طاهي/ة", label: "طاهي/ة" },
    { value: "نادل/ة", label: "نادل/ة" },
    { value: "باريستا", label: "باريستا" },
    { value: "كاشير", label: "كاشير" },
    { value: "مدير", label: "مدير" },
    { value: "توصيل", label: "توصيل" },
    { value: "مضيف/ة", label: "مضيف/ة" },
    { value: "أخرى", label: "أخرى" },
  ];

  const locations = [
    { value: "رام الله", label: "رام الله" },
    { value: "نابلس", label: "نابلس" },
    { value: "الخليل", label: "الخليل" },
    { value: "بيت لحم", label: "بيت لحم" },
    { value: "جنين", label: "جنين" },
    { value: "طولكرم", label: "طولكرم" },
    { value: "قلقيلية", label: "قلقيلية" },
    { value: "بئر السبع", label: "بئر السبع" },
  ];

  const filtered = seekers.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.profiles?.full_name?.includes(searchTerm) ||
      s.job_title?.includes(searchTerm) ||
      s.bio?.includes(searchTerm);
    const matchesCategory = !category || s.job_title?.includes(category);
    const matchesLocation =
      !location || s.profiles?.location?.includes(location);
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">
          البحث في السير الذاتية
        </h1>
        <p className="text-sm text-slate-500">
          ابحث عن أفضل الكفاءات والكوادر الجاهزة للعمل في مطعمك
        </p>
      </div>

      {/* Search Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex flex-col md:flex-row gap-1.5 shadow-sm">
        <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-xl relative">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو المسمى الوظيفي..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="grid grid-cols-2 md:flex md:w-auto gap-1.5">
          <div className="w-full md:w-40 bg-slate-50 md:border-r border-slate-200 rounded-xl relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-700 text-sm py-2.5 px-3 appearance-none outline-none"
            >
              <option value="">كل التخصصات</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-40 bg-slate-50 md:border-r border-slate-200 rounded-xl relative">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-700 text-sm py-2.5 px-3 appearance-none outline-none"
            >
              <option value="">كل المدن</option>
              {locations.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setSearchTerm("");
              setCategory("");
              setLocation("");
            }}
            className="hidden md:flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto shadow-sm"
          >
            <Filter className="w-4 h-4" /> إعادة
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs font-semibold text-slate-500">
          {loading
            ? "جاري التحميل..."
            : `تم العثور على ${filtered.length} سيرة ذاتية`}
        </div>
      </div>

      {/* Candidates Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">لا توجد نتائج مطابقة</p>
          <p className="text-sm mt-1">جرب تغيير كلمات البحث أو الفلاتر</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((candidate) => (
            <div
              key={candidate.profile_id}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-brand-200 hover:shadow-md transition-all flex flex-col h-full"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xl shrink-0 shadow-sm border border-brand-200 overflow-hidden">
                  {candidate.profiles?.avatar_url ? (
                    <img
                      src={candidate.profiles.avatar_url}
                      alt={candidate.profiles.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    candidate.profiles?.full_name?.[0] || "؟"
                  )}
                </div>
                <div className="flex-grow pt-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-0.5">
                    {candidate.profiles?.full_name || "مستخدم"}
                  </h3>
                  <p className="text-brand-600 text-sm font-medium">
                    {candidate.job_title || "باحث عن عمل"}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{candidate.profiles?.location || "غير محدد"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    خبرة {candidate.experience_years || 0} سنوات
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{candidate.is_available ? "متاح للعمل" : "غير متاح"}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5 flex-grow">
                {(candidate.skills || []).slice(0, 5).map((skill, i) => (
                  <span
                    key={i}
                    className="bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="pt-3.5 border-t border-slate-50 mt-auto">
                <button className="w-full bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 shadow-sm">
                  عرض السيرة الذاتية
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
