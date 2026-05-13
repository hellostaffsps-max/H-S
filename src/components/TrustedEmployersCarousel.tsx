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
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="w-full bg-white border-y border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[220px] h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (employers.length === 0) return null;

  return (
    <section className="w-full bg-gradient-to-b from-slate-50/50 to-white border-y border-slate-100 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-200">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                منشآت تثق بـ Hello Staff
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                شركاؤنا في قطاع الضيافة والمطاعم
              </p>
            </div>
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:shadow-md transition-all shadow-sm"
              aria-label="السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:shadow-md transition-all shadow-sm"
              aria-label="التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {employers.map((emp) => (
              <div
                key={emp.id}
                className="group relative min-w-[220px] sm:min-w-[240px] bg-white border border-slate-100 rounded-2xl p-5 flex flex-col items-center gap-3 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-300 cursor-default select-none"
              >
                {/* Verified badge */}
                {emp.is_verified && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md z-10">
                    <Star className="w-3 h-3 fill-white" />
                    موثق
                  </div>
                )}

                {/* Logo */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300 p-2">
                  {emp.logo_url ? (
                    <Image
                      src={emp.logo_url}
                      alt={emp.name}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                {/* Name */}
                <p className="text-sm font-bold text-slate-800 text-center line-clamp-1">
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
