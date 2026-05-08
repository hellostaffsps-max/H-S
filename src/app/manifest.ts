import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hello Staff - منصة التوظيف في قطاع الضيافة",
    short_name: "Hello Staff",
    description: "منصة توظيف متخصصة في قطاع الضيافة في فلسطين - ابحث عن وظائف وفرص عمل",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    categories: ["business", "employment"],
    icons: [
      {
        src: "/icons/icon-72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/icon-128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icons/icon-144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/icon-152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    lang: "ar",
    dir: "rtl",
    screenshots: [],
    prefer_related_applications: false,
  };
}
