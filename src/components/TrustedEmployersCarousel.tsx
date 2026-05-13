"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TrustedEmployer {
  id: string;
  name: string;
  logo_url: string | null;
  is_verified: boolean;
}

export default function TrustedEmployersCarousel() {
  const [employers, setEmployers] = useState<TrustedEmployer[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmployers();
  }, []);

  async function fetchEmployers() {
    const { data, error } = await supabase
      .from("trusted_employers")
      .select("id, name, logo_url, is_verified")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching trusted employers:", error.message);
    } else {
      setEmployers(data || []);
    }
    setLoading(false);
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="min-w-[200px] h-24 bg-slate-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (employers.length === 0) return null;

  return (
    <section className="w-full bg-white/60 backdrop-blur-sm border-y border-slate-100 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                منشآت تثق بـ Hello Staff
              </h3>
              <p className="text-xs text-slate-500">
                شركاؤنا في قطاع الضيافة والمطاعم
              </p>
            </div>
          </div>

          {/* Arrows (desktop only) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm"
              aria-label="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {employers.map((emp) => (
              <div
                key={emp.id}
                className="group relative min-w-[180px] sm:min-w-[200px] bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-brand-200 hover:shadow-lg transition-all cursor-default select-none"
              >
                {/* Verified badge */}
                {emp.is_verified && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm z-10">
                    <Star className="w-3 h-3 fill-white" />
                    موثق
                  </div>
                )}

                {/* Logo */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform p-1.5">
                  {emp.logo_url ? (
                    <Image
                      src={emp.logo_url}
                      alt={emp.name}
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                {/* Name */}
                <p className="text-xs sm:text-sm font-bold text-slate-700 text-center line-clamp-1">
                  {emp.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
