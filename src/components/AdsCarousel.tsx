"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

type Ad = {
  id: string;
  title: string;
  media_url: string;
  media_type: 'image' | 'video';
  link_url: string | null;
};

export default function AdsCarousel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAds() {
      try {
        const { data, error } = await supabase
          .from('advertisements')
          .select('id, title, media_url, media_type, link_url')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setAds(data || []);
      } catch (err) {
        console.error('Error loading ads:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAds();
  }, []);

  const nextSlide = useCallback(() => {
    if (ads.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const prevSlide = useCallback(() => {
    if (ads.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(nextSlide, 3000);
    return () => clearInterval(timer);
  }, [ads.length, nextSlide]);

  if (loading || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 mt-8">
      <div className="relative aspect-[21/9] sm:aspect-[21/7] w-full rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] group border border-white/20 bg-slate-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAd.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {currentAd.link_url ? (
              <a href={currentAd.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                <AdMedia ad={currentAd} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </a>
            ) : (
              <div className="w-full h-full relative">
                <AdMedia ad={currentAd} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Glassmorphism style */}
        {ads.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevSlide(); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-110 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-110 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Progress Indicators - Bottom Dots */}
        {ads.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {ads.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="relative h-1.5 transition-all duration-500 overflow-hidden rounded-full bg-white/30 hover:bg-white/50"
                style={{ width: idx === currentIndex ? '40px' : '12px' }}
              >
                {idx === currentIndex && (
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="absolute inset-0 bg-white"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AdMedia({ ad }: { ad: Ad }) {
  if (ad.media_type === 'video') {
    return (
      <video
        src={ad.media_url}
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Blurred background for non-standard ratios */}
      <img
        src={ad.media_url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-110"
      />
      {/* Main image */}
      <img
        src={ad.media_url}
        alt={ad.title}
        className="relative z-10 w-full h-full object-cover"
      />
    </div>
  );
}
