"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, Briefcase, Star, Filter, Loader2, MessageCircle, Trophy, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSearchFilters } from "@/app/actions/search-filters";
import Image from "next/image";
import Link from "next/link";

interface SeekerProfile {
  profile_id: string;
  job_title: string;
  bio: string;
  experience_years: number;
  skills: string[];
  is_available: boolean;
  current_employer: string | null;
  is_featured: boolean | null;
  verification_status: string | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    location: string | null;
  } | null;
}

export default function SearchResumes() {
  const searchParams = useSearchParams();
  const [seekers, setSeekers] = useState<SeekerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("cat") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  // Dynamic filter options from DB
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbSeekerTitles, setDbSeekerTitles] = useState<string[]>([]);
  const [dbLocations, setDbLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchSeekers();
    getSearchFilters().then((filters) => {
      setDbCategories(filters.categories);
      setDbSeekerTitles(filters.seekerTitles);
      setDbLocations(filters.locations);
    });
  }, []);

  async function fetchSeekers() {
    setLoading(true);
    const [{ data: seekersData, error: seekersError }, { data: profilesData, error: profilesError }] = await Promise.all([
      supabase
        .from("seekers")
        .select(`
          profile_id,
          job_title,
          bio,
          experience_years,
          skills,
          is_available,
          current_employer,
          is_featured,
          verification_status
        `)
        .eq("is_available", true),
      supabase
        .from("public_profiles")
        .select("id, full_name, avatar_url, location"),
    ]);

    if (seekersError) {
      console.error("Error fetching seekers:", seekersError);
    }
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

    const normalized = (seekersData || []).map((item: any) => {
      const prof = profileMap.get(item.profile_id);
      return {
        ...item,
        profiles: prof
          ? {
              full_name: prof.full_name,
              avatar_url: prof.avatar_url,
              location: prof.location,
            }
          : null,
      };
    });

    // Sort: featured first, then by experience
    const sorted = normalized.sort((a: any, b: any) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (b.experience_years || 0) - (a.experience_years || 0);
    });

    setSeekers(sorted as SeekerProfile[]);
    setLoading(false);
  }

  // Default categories - always shown + any new from DB
  const defaultCats = ["\u0637\u0627\u0647\u064a/\u0629", "\u0646\u0627\u062f\u0644/\u0629", "\u0628\u0627\u0631\u064a\u0633\u062a\u0627", "\u0643\u0627\u0634\u064a\u0631", "\u0645\u062f\u064a\u0631", "\u062a\u0648\u0635\u064a\u0644", "\u0645\u0636\u064a\u0641/\u0629", "\u0623\u062e\u0631\u0649"];
  const allDbCats = [...new Set([...dbCategories, ...dbSeekerTitles])];
  const extraCats = allDbCats.filter(c => !defaultCats.includes(c));
  const categoryOptions = [...defaultCats, ...extraCats].map(c => ({ value: c, label: c }));

  // Default locations - always shown + any new from DB
  const defaultLocs = ["\u0631\u0627\u0645 \u0627\u0644\u0644\u0647", "\u0646\u0627\u0628\u0644\u0633", "\u0627\u0644\u062e\u0644\u064a\u0644", "\u0628\u064a\u062a \u0644\u062d\u0645", "\u062c\u0646\u064a\u0646", "\u0637\u0648\u0644\u0643\u0631\u0645", "\u0642\u0644\u0642\u064a\u0644\u064a\u0629", "\u0623\u0631\u064a\u062d\u0627", "\u0633\u0644\u0641\u064a\u062a", "\u0637\u0648\u0628\u0627\u0633", "\u0627\u0644\u0642\u062f\u0633"];
  const extraLocs = dbLocations.filter(l => !defaultLocs.includes(l));
  const locationOptions = [...defaultLocs, ...extraLocs].map(l => ({ value: l, label: l }));

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
          {"\u0627\u0644\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0633\u064a\u0631 \u0627\u0644\u0630\u0627\u062a\u064a\u0629"}
        </h1>
        <p className="text-sm text-slate-500">
          {"\u0627\u0628\u062d\u062b \u0639\u0646 \u0623\u0641\u0636\u0644 \u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062a \u0648\u0627\u0644\u0643\u0648\u0627\u062f\u0631 \u0627\u0644\u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0639\u0645\u0644 \u0641\u064a \u0645\u0637\u0639\u0645\u0643"}
        </p>
      </div>

      {/* Search Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex flex-col md:flex-row gap-1.5 shadow-sm">
        <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-xl relative">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={"\u0627\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a..."}
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
              <option value="">{"\u0643\u0644 \u0627\u0644\u062a\u062e\u0635\u0635\u0627\u062a"}</option>
              {categoryOptions.map((c) => (
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
              <option value="">{"\u0643\u0644 \u0627\u0644\u0645\u062f\u0646"}</option>
              {locationOptions.map((l) => (
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
            <Filter className="w-4 h-4" /> {"\u0625\u0639\u0627\u062f\u0629"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs font-semibold text-slate-500">
          {loading
            ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..."
            : `\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 ${filtered.length} \u0633\u064a\u0631\u0629 \u0630\u0627\u062a\u064a\u0629`}
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
          <p className="text-lg font-medium">{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629"}</p>
          <p className="text-sm mt-1">{"\u062c\u0631\u0628 \u062a\u063a\u064a\u064a\u0631 \u0643\u0644\u0645\u0627\u062a \u0627\u0644\u0628\u062d\u062b \u0623\u0648 \u0627\u0644\u0641\u0644\u0627\u062a\u0631"}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((candidate) => (
            <div
              key={candidate.profile_id}
              className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all flex flex-col h-full ${
                candidate.is_featured
                  ? 'border-amber-200 ring-1 ring-amber-100 hover:border-amber-300'
                  : 'border-slate-100 hover:border-brand-200'
              }`}
            >
              {/* Featured & Verification Banners */}
              <div className="flex flex-wrap gap-2 mb-3">
                {candidate.is_featured && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 rounded-xl text-xs font-bold border border-amber-200">
                    <Trophy className="h-3.5 w-3.5 text-amber-600" />
                    {"\u0645\u0648\u0638\u0641 \u0645\u0645\u064a\u0632"}
                  </div>
                )}
                {candidate.verification_status === 'verified' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-100 to-emerald-50 text-brand-800 rounded-xl text-xs font-bold border border-brand-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                    {"\u0645\u0648\u062b\u0642"}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 shadow-sm overflow-hidden relative ${
                  candidate.is_featured
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-brand-100 text-brand-700 border border-brand-200'
                }`}>
                  {candidate.profiles?.avatar_url ? (
                    <Image
                      src={candidate.profiles.avatar_url}
                      alt={candidate.profiles.full_name || "\u0645\u0633\u062a\u062e\u062f\u0645"}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    candidate.profiles?.full_name?.[0] || "\u061f"
                  )}
                </div>
                <div className="flex-grow pt-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-0.5">
                    {candidate.profiles?.full_name || "\u0645\u0633\u062a\u062e\u062f\u0645"}
                  </h3>
                  <p className="text-brand-600 text-sm font-medium">
                    {candidate.job_title || "\u0628\u0627\u062d\u062b \u0639\u0646 \u0639\u0645\u0644"}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{candidate.profiles?.location || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    {"\u062e\u0628\u0631\u0629"} {candidate.experience_years || 0} {"\u0633\u0646\u0648\u0627\u062a"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{candidate.is_available ? "\u0645\u062a\u0627\u062d \u0644\u0644\u0639\u0645\u0644" : "\u063a\u064a\u0631 \u0645\u062a\u0627\u062d"}</span>
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
                <Link
                  href={`/messages?with=${candidate.profile_id}`}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  {"\u062a\u0648\u0627\u0635\u0644"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
