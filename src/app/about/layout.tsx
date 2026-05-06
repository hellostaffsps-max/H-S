import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "من نحن",
  description:
    "تعرف على Hello Staff، أول منصة توظيف متخصصة في قطاع الضيافة في فلسطين. مهمتنا ربط الكفاءات بأصحاب العمل.",
  openGraph: {
    title: "من نحن | Hello Staff",
    description: "تعرف على فريق Hello Staff ورؤيتنا",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
