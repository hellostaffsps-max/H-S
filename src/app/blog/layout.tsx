import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المدونة",
  description:
    "مقالات ونصائح حول التوظيف، قطاع الضيافة، بناء السيرة الذاتية، والمقابلات الشخصية.",
  openGraph: {
    title: "المدونة | Hello Staff",
    description: "اقرأ أحدث المقالات حول التوظيف والضيافة",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
