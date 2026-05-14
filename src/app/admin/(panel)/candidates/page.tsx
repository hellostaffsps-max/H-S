"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserCircle, Search, Loader2, MapPin, Calendar, Briefcase, Star, CheckCircle, XCircle, ShieldCheck, Clock, Eye, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SeekerDetailModal from "@/components/admin/SeekerDetailModal";

interface Seeker {
  profile_id: string;
  job_title: string | null;
  experience_years: number | null;
  skills: string[] | null;
  availability: string | null;
  bio: string | null;
  cv_url: string | null;
  is_available: boolean | null;
  current_employer: string | null;
  verification_status: string | null;
  is_featured: boolean | null;
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
  const [selectedSeeker, setSelectedSeeker] = useState<Seeker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSeekers();
  }, []);

  async function fetchSeekers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("seekers")
        .select("*, profiles!seekers_profile_id_fkey(full_name, email, phone, location, avatar_url, created_at, role)")
        .limit(200);

      if (error) throw error;

      const filteredData = (data || []).filter((s) => s.profiles?.role !== 'admin');

      const sorted = filteredData.sort((a, b) => {
        // Featured first, then by date
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
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

  async function handleUpdateVerification(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/seekers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update");

      setSeekers((prev) =>
        prev.map((s) =>
          s.profile_id === id ? { ...s, verification_status: status } : s
        )
      );
      if (selectedSeeker?.profile_id === id) {
        setSelectedSeeker({ ...selectedSeeker, verification_status: status });
      }
      alert("Verification status updated successfully");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  }

  async function handleToggleFeatured(id: string, featured: boolean) {
    try {
      const res = await fetch(`/api/admin/seekers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_featured: featured }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update");

      setSeekers((prev) =>
        prev.map((s) =>
          s.profile_id === id ? { ...s, is_featured: featured } : s
        )
      );
      if (selectedSeeker?.profile_id === id) {
        setSelectedSeeker({ ...selectedSeeker, is_featured: featured });
      }
      alert(featured ? "\u062a\u0645 \u062a\u0645\u064a\u064a\u0632 \u0627\u0644\u0645\u0648\u0638\u0641 \u0628\u0646\u062c\u0627\u062d" : "\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u062a\u0645\u064a\u064a\u0632 \u0627\u0644\u0645\u0648\u0638\u0641");
    } catch (e: any) {
      alert("\u062e\u0637\u0623: " + e.message);
    }
  }

  const getVerificationBadge = (status: string | null) => {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
          <ShieldCheck className="h-3 w-3" /> \u0645\u0648\u062b\u0642
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
          <XCircle className="h-3 w-3" /> \u0645\u0631\u0641\u0648\u0636
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
        <Clock className="h-3 w-3" /> \u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629
      </span>
    );
  };

  const filtered = seekers.filter((s) =>
    s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">\u0627\u0644\u0645\u0631\u0634\u062d\u0648\u0646</h2>
          <p className="text-slate-500">\u0625\u062f\u0627\u0631\u0629 \u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0628\u0627\u062d\u062b\u064a\u0646 \u0639\u0646 \u0639\u0645\u0644</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100">
          <UserCircle className="h-4 w-4 text-brand-600" />
          <span className="font-bold">{seekers.length}</span> \u0645\u0631\u0634\u062d \u0645\u0633\u062c\u0644
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="\u0627\u0644\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a \u0623\u0648 \u0627\u0644\u0645\u0647\u0627\u0631\u0629..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">\u0627\u0644\u0645\u0631\u0634\u062d</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">\u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">\u0627\u0644\u062e\u0628\u0631\u0629</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">\u0627\u0644\u062d\u0627\u0644\u0629</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">\u0627\u0644\u062a\u0633\u062c\u064a\u0644</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    {searchTerm ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629" : "\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0631\u0634\u062d\u0648\u0646 \u0645\u0633\u062c\u0644\u0648\u0646 \u0628\u0639\u062f"}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.profile_id}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${s.is_featured ? 'bg-amber-50/30' : ''}`}
                    onClick={() => {
                      setSelectedSeeker(s);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0 overflow-hidden">
                          {s.profiles?.avatar_url ? (
                            <Image src={s.profiles.avatar_url} alt="" fill className="object-cover rounded-full" sizes="40px" />
                          ) : (
                            <UserCircle className="h-5 w-5 text-brand-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-900">{s.profiles?.full_name || "\u0628\u062f\u0648\u0646 \u0627\u0633\u0645"}</p>
                            {s.is_featured && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 border border-amber-300 rounded-full text-[9px] font-bold">
                                <Trophy className="h-2.5 w-2.5" /> \u0645\u0645\u064a\u0632
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.profiles?.location || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        {s.job_title || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm text-slate-700">
                          {s.experience_years != null ? `${s.experience_years} \u0633\u0646\u0648\u0627\u062a` : "\u2014"}
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
                          <span className="text-xs text-slate-400">\u2014</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getVerificationBadge(s.verification_status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(s.profiles?.created_at || 0).toLocaleDateString("ar-EG")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="p-2 hover:bg-brand-50 text-slate-400 hover:text-brand-600 rounded-lg transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSeeker(s);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedSeeker && (
        <SeekerDetailModal
          seeker={selectedSeeker}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSeeker(null);
          }}
          onUpdateVerification={handleUpdateVerification}
          onToggleFeatured={handleToggleFeatured}
        />
      )}
    </div>
  );
}
