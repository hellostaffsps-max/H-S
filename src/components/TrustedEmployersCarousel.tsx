"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, Star } from "lucide-react";
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

  if (loading || employers.length === 0) return null;

  // Duplicate items to ensure smooth infinite scrolling - more duplicates for wider screens
  const scrollItems = [...employers, ...employers, ...employers, ...employers, ...employers, ...employers];

  return (
    <section className="w-full py-8 sm:py-10 overflow-hidden bg-white border-y border-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-center gap-3">
          <h3 className="text-lg sm:text-xl font-black text-slate-800">
            منشآت تثق بـ Hello Staff
          </h3>
        </div>
      </div>

      <div className="relative w-full flex overflow-hidden group">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 60s linear infinite;
          }
          .group:hover .animate-marquee {
            animation-play-state: paused;
          }
        `}</style>
        
        {/* Left-to-right fade masks */}
        <div className="absolute top-0 left-0 w-16 sm:w-32 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 sm:w-32 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex w-max animate-marquee" dir="ltr">
          {scrollItems.map((emp, index) => (
            <div
              key={`${emp.id}-${index}`}
              className="flex items-center gap-3 mx-6 sm:mx-8 cursor-default opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-transparent flex items-center justify-center">
                {emp.logo_url ? (
                  <Image src={emp.logo_url} alt={emp.name} fill className="object-contain" sizes="40px" />
                ) : (
                  <Building2 className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
                  {emp.name}
                </span>
                {emp.is_verified && (
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="text-[9px] font-bold">موثق</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
