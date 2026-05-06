import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "منشئ السيرة الذاتية",
  description:
    "أنشئ سيرتك الذاتية الاحترافية مجاناً. قوالب مصممة خصيصاً لقطاع الضيافة في فلسطين.",
  openGraph: {
    title: "منشئ السيرة الذاتية | Hello Staff",
    description: "أنشئ سيرتك الذاتية الاحترافية",
  },
};

export default function CVBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
