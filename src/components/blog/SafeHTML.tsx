"use client";

import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";

export default function SafeHTML({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = DOMPurify.sanitize(html);
    }
  }, [html]);

  return <div ref={containerRef} />;
}
