import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hello Staff - منصة التوظيف في قطاع الضيافة",
    short_name: "Hello Staff",
    description: "منصة توظيف متخصصة في قطاع الضيافة في فلسطين",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    lang: "ar",
    dir: "rtl",
  };
}
