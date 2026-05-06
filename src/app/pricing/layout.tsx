import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الأسعار والباقات",
  description:
    "اختر الباقة المناسبة لك. باقات مرنة لأصحاب العمل والباحثين عن عمل في قطاع الضيافة.",
  openGraph: {
    title: "الأسعار والباقات | Hello Staff",
    description: "باقات اشتراك مرنة لأصحاب العمل",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
