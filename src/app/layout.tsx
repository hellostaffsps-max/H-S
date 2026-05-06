import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import LayoutBody from "./LayoutBody";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Hello Staff - منصة التوظيف في قطاع الضيافة",
    template: "%s | Hello Staff",
  },
  description:
    "منصة Hello Staff هي أول منصة توظيف متخصصة في قطاع الضيافة في فلسطين. ابحث عن وظائف، انشر فرص عمل، وابنِ مسيرتك المهنية.",
  keywords: [
    "وظائف",
    "ضيافة",
    "فلسطين",
    "مطاعم",
    "فنادق",
    "توظيف",
    "طاهي",
    "نادل",
    "باريستا",
    "كاشير",
  ],
  authors: [{ name: "Hello Staff" }],
  creator: "Hello Staff",
  metadataBase: new URL("https://www.staffps.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar",
    siteName: "Hello Staff",
    url: "https://www.staffps.com",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@hellostaff",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased font-sans`}>
        <LayoutBody>{children}</LayoutBody>
      </body>
    </html>
  );
}
