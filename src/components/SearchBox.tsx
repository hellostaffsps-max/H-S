"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Briefcase, SlidersHorizontal } from "lucide-react";

export default function SearchBox() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (category) params.set("cat", category);
    if (type) params.set("type", type);
    if (location) params.set("location", location);

    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-2xl shadow-black/10 p-2 md:p-3 border border-white/20 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="flex flex-col md:flex-row items-stretch gap-2">
        {/* Search Input */}
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl md:rounded-2xl px-3 py-2.5 md:px-4 md:py-3 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 min-h-[44px]">
          <Search className="h-5 w-5 text-brand-500 shrink-0" />
          <input
            type="text"
            placeholder="ابحث عن وظيفة (مثال: طاهي، نادل...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm md:text-base font-medium"
          />
        </div>

        {/* Category Select */}
        <div className="md:w-40 flex items-center gap-2 bg-slate-50 rounded-xl md:rounded-2xl px-3 py-2.5 md:px-4 md:py-3 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 min-h-[44px]">
          <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-700 text-sm md:text-base font-medium appearance-none cursor-pointer"
          >
            <option value="">التخصص</option>
            <option value="طاهي/ة">طاهي/ة</option>
            <option value="نادل/ة">نادل/ة</option>
            <option value="باريستا">باريستا</option>
            <option value="كاشير">كاشير</option>
            <option value="مدير">مدير</option>
            <option value="توصيل">توصيل</option>
            <option value="مضيف/ة">مضيف/ة</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        {/* Type Select */}
        <div className="md:w-36 flex items-center gap-2 bg-slate-50 rounded-xl md:rounded-2xl px-3 py-2.5 md:px-4 md:py-3 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 min-h-[44px]">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-700 text-sm md:text-base font-medium appearance-none cursor-pointer"
          >
            <option value="">نوع الدوام</option>
            <option value="دوام كامل">دوام كامل</option>
            <option value="دوام جزئي">دوام جزئي</option>
          </select>
        </div>

        {/* Location Input */}
        <div className="md:w-36 flex items-center gap-2 bg-slate-50 rounded-xl md:rounded-2xl px-3 py-2.5 md:px-4 md:py-3 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 min-h-[44px]">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="المدينة"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm md:text-base font-medium"
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl md:rounded-2xl px-6 py-2.5 md:px-8 md:py-3 text-sm md:text-base font-bold transition-all shadow-lg shadow-brand-500/25 active:scale-95 flex items-center justify-center gap-2 shrink-0 min-h-[44px] min-w-[44px]"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">بحث</span>
        </button>
      </div>
    </form>
  );
}
