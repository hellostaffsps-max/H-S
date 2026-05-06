import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description: "شروط وأحكام استخدام منصة Hello Staff. يرجى قراءتها بعناية قبل استخدام المنصة.",
  openGraph: {
    title: "شروط الاستخدام | Hello Staff",
    description: "شروط وأحكام استخدام المنصة",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
