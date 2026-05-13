"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, Building2 } from "lucide-react";
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

  if (loading) {
    return (
      <section className="w-full bg-gradient-to-b from-slate-50/30 to-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (employers.length === 0) return null;

  return (
    <section className="w-full bg-gradient-to-b from-slate-50/30 to-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-10 sm:mb-14">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-200/50">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              منشآت تثق بـ Hello Staff
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              شركاؤنا في قطاع الضيافة والمطاعم
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
          {employers.map((emp, index) => (
            <div
              key={emp.id}
              className="group relative bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-brand-500/8 hover:-translate-y-2 transition-all duration-500 cursor-default select-none overflow-visible"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Floating Logo Container */}
              <div className="relative -mt-8 mx-auto w-fit z-20">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-lg shadow-slate-200/60 ring-4 ring-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-110 group-hover:shadow-xl transition-all duration-500">
                  {emp.logo_url ? (
                    <Image
                      src={emp.logo_url}
                      alt={emp.name}
                      fill
                      className="object-contain p-3"
                      sizes="96px"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                {/* Cinematic Verified Badge */}
                {emp.is_verified && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30">
                    <div className="relative">
                      {/* Glow pulse behind */}
                      <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-60 animate-pulse" />
                      <div className="relative bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-amber-400/30 border border-amber-300/50 whitespace-nowrap">
                        <Star className="w-3 h-3 fill-white animate-pulse" />
                        موثق
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="pt-14 pb-6 px-4 text-center">
                <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-relaxed">
                  {emp.name}
                </p>
              </div>

              {/* Hover Shine Effect */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
