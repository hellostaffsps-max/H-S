"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Building2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TrustedEmployer {
  id: string;
  name: string;
  logo_url: string | null;
}

export default function TrustedEmployersCarousel() {
  const [employers, setEmployers] = useState<TrustedEmployer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployers();
  }, []);

  async function fetchEmployers() {
    const { data, error } = await supabase
      .from("employers")
      .select("profile_id, company_name, logo_url")
      .eq("verification_status", "verified")
      .not("logo_url", "is", null);

    if (error) {
      console.error("Error fetching trusted employers:", error.message);
    } else {
      const mapped = (data || []).map((emp) => ({
        id: emp.profile_id,
        name: emp.company_name,
        logo_url: emp.logo_url,
      }));
      setEmployers(mapped);
    }
    setLoading(false);
  }

  if (loading || employers.length === 0) return null;

  // --- Infinite loop logic ---
  // Step 1: Duplicate employers until we have at least 10 visible items.
  //         This ensures the strip always looks full on any screen size,
  //         even if only 1 employer exists.
  const MIN_VISIBLE = 10;
  let baseItems = [...employers];
  while (baseItems.length < MIN_VISIBLE) {
    baseItems = [...baseItems, ...employers];
  }

  // Step 2: Double the base set so the CSS animation can seamlessly jump back
  //         to position 0 when it reaches -50% (the end of the first half).
  //         Result: a true infinite "doullab" with no gaps or jumps.
  const scrollItems = [...baseItems, ...baseItems];

  // Speed: each item takes ~4 s to cross the strip
  const duration = baseItems.length * 4;

  return (
    <section className="w-full py-6 sm:py-8 bg-white border-y border-slate-100">
      {/* Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
        <div className="flex items-center justify-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h3 className="text-base sm:text-lg font-black text-slate-800">
            منشآت تثق بـ Hello Staff
          </h3>
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
        </div>
      </div>

      {/* Scrolling track */}
      <div className="relative w-full overflow-hidden">
        {/* Fade masks */}
        <div
          className="absolute top-0 right-0 w-20 sm:w-36 h-full z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, white 0%, transparent 100%)" }}
        />
        <div
          className="absolute top-0 left-0 w-20 sm:w-36 h-full z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, white 0%, transparent 100%)" }}
        />

        {/* The scrolling row — always LTR so animation direction is predictable */}
        <div
          className="flex items-center"
          style={{
            width: "max-content",
            animation: `trusted-scroll ${duration}s linear infinite`,
            willChange: "transform",
          }}
          dir="ltr"
        >
          {scrollItems.map((emp, index) => (
            <div
              key={`${emp.id}-${index}`}
              className="flex items-center gap-2.5 mx-5 sm:mx-7 shrink-0"
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                {emp.logo_url ? (
                  <Image
                    src={emp.logo_url}
                    alt={emp.name}
                    fill
                    className="object-contain"
                    sizes="36px"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
                {emp.name}
              </span>
              <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                موثق
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes trusted-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
