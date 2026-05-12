"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src?: string | null;
  alt?: string;
  children: React.ReactNode;
  className?: string;
}

export default function ImageLightbox({
  src,
  alt = "صورة",
  children,
  className,
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (src) setIsOpen(true);
  }, [src]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <div
        className={cn("cursor-pointer", className)}
        onClick={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") open();
        }}
      >
        {children}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            aria-label="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Protected image container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] select-none"
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Overlay to prevent direct image access */}
            <div className="absolute inset-0 z-10" />

            <Image
              src={src!}
              alt={alt}
              width={800}
              height={800}
              className="object-contain max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl select-none pointer-events-none"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              priority
            />

            {/* Hint */}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium bg-black/40 px-3 py-1 rounded-full z-20 pointer-events-none">
              اضغط في أي مكان للإغلاق
            </p>
          </div>
        </div>
      )}
    </>
  );
}
