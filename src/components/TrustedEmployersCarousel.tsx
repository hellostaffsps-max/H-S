"use client";

import { useEffect, useState } from "react";
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
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((emp) => ({
      id: emp.profile_id,
      name: emp.company_name,
      logo_url: emp.logo_url,
    }));
    setEmployers(mapped);
    setLoading(false);
  }

  if (loading || employers.length === 0) return null;

  // ── Duplication logic ──────────────────────────────────────────────────────
  // We need TWO perfectly identical halves so that when the CSS animation
  // reaches -50% it can snap back to 0 with no visible jump.
  //
  // First, pad `employers` to at least MIN_VISIBLE items so the strip is
  // always visually full even with very few entries.
  const MIN_VISIBLE = 12; // items in ONE half → 2× in the DOM
  let half = [...employers];
  while (half.length < MIN_VISIBLE) {
    half = [...half, ...employers];
  }
  // The full scroll row = first half + identical second half
  const scrollItems = [...half, ...half];

  // Duration: ~3 s per item so it's comfortable to read
  const durationSec = half.length * 3;

  return (
    <section className="w-full py-6 sm:py-8 bg-white border-y border-slate-100 overflow-hidden">
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

      {/* Scrolling track — MUST be dir="ltr" even on RTL pages.
          In RTL, overflow:hidden shows the rightmost part of overflowing
          content first, which breaks the animation.  Forcing ltr here
          makes the container show the leftmost items first so the
          translateX(-50%) animation produces a seamless left-scrolling loop. */}
      <div className="relative w-full overflow-hidden" dir="ltr">
        {/* Fade masks — purely cosmetic */}
        <div
          className="absolute inset-y-0 right-0 w-16 sm:w-28 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, white, transparent)" }}
        />
        <div
          className="absolute inset-y-0 left-0 w-16 sm:w-28 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, white, transparent)" }}
        />

        {/*
          The scrolling row.
          - `width: max-content`  → row never wraps
          - `dir="ltr"`           → items flow left-to-right regardless of page RTL
          - `.animate-marquee-ltr` (defined in globals.css) moves the row by -50%
            (= one half-width) then snaps back to 0 — seamless infinite loop.
          - CSS variable `--marquee-duration` controls speed.
        */}
        <div
          className="flex items-center animate-marquee-ltr"
          style={{
            width: "max-content",
            // pass duration via CSS variable so globals.css can read it
            ["--marquee-duration" as string]: `${durationSec}s`,
          }}
          dir="ltr"
        >
          {scrollItems.map((emp, index) => (
            <div
              key={`${emp.id}-${index}`}
              className="flex items-center gap-2.5 mx-6 sm:mx-8 shrink-0"
            >
              {/* Logo */}
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                {emp.logo_url ? (
                  <Image
                    src={emp.logo_url}
                    alt={emp.name}
                    fill
                    className="object-contain"
                    sizes="36px"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-slate-300 m-auto" />
                )}
              </div>

              {/* Name */}
              <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
                {emp.name}
              </span>

              {/* Badge */}
              <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-100 whitespace-nowrap">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                موثق
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
