import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الوظائف المتاحة",
  description:
    "تصفح أحدث فرص العمل في قطاع الضيافة في فلسطين. وظائف للطهاة، النادلين، الباريستا، والمزيد.",
  openGraph: {
    title: "الوظائف المتاحة | Hello Staff",
    description: "ابحث عن وظيفتك القادمة في قطاع الضيافة",
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
