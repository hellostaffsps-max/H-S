import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "البحث في السير الذاتية",
  description:
    "ابحث عن أفضل الكفاءات والكوادر الجاهزة للعمل في قطاع الضيافة في فلسطين.",
  openGraph: {
    title: "البحث في السير الذاتية | Hello Staff",
    description: "ابحث عن أفضل الكفاءات في قطاع الضيافة",
  },
};

export default function SearchResumesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
