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
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="relative h-[200px] sm:h-[300px] md:h-[400px] w-full rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-900/10 group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAd.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {currentAd.link_url ? (
              <a href={currentAd.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <AdMedia ad={currentAd} />
              </a>
            ) : (
              <div className="w-full h-full">
                <AdMedia ad={currentAd} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {ads.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevSlide(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots */}
        {ads.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {ads.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/40'
                }`}
              />
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
    <img
      src={ad.media_url}
      alt={ad.title}
      className="w-full h-full object-cover"
    />
  );
}
