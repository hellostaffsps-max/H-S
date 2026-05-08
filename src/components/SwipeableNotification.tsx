"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableNotificationProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export default function SwipeableNotification({ children, onDelete }: SwipeableNotificationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const THRESHOLD = 80; // pixels to trigger delete

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    setIsSwiping(true);
  }

  function handleMouseDown(e: React.MouseEvent) {
    startXRef.current = e.clientX;
    currentXRef.current = 0;
    setIsSwiping(true);

    const handleMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startXRef.current;
      // Only allow swiping left (negative)
      const clampedDiff = Math.min(0, Math.max(-150, diff));
      currentXRef.current = clampedDiff;
      setTranslateX(clampedDiff);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      finishSwipe();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startXRef.current;
    // Only allow swiping left (negative)
    const clampedDiff = Math.min(0, Math.max(-150, diff));
    currentXRef.current = clampedDiff;
    setTranslateX(clampedDiff);
  }

  function handleTouchEnd() {
    finishSwipe();
  }

  function finishSwipe() {
    setIsSwiping(false);
    if (currentXRef.current < -THRESHOLD) {
      // Trigger delete animation
      setIsDeleting(true);
      setTranslateX(-500);
      setTimeout(() => {
        onDelete();
      }, 300);
    } else {
      // Snap back
      setTranslateX(0);
    }
  }

  const deleteOpacity = Math.min(1, Math.abs(translateX) / THRESHOLD);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", isDeleting && "max-h-0 transition-all duration-300")}
      style={{ direction: "ltr" }} // Swipe logic in LTR
    >
      {/* Delete background */}
      <div
        className="absolute inset-0 flex items-center justify-end px-6 bg-red-500"
        style={{ opacity: deleteOpacity }}
      >
        <Trash2 className="h-5 w-5 text-white" />
      </div>

      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        className="relative bg-white"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
          direction: "rtl",
        }}
      >
        {children}
      </div>
    </div>
  );
}
