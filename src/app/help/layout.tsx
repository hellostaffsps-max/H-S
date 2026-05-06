import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مركز المساعدة",
  description:
    "إجابات على الأسئلة الشائعة ودليل استخدام منصة Hello Staff. كيفية التسجيل، النشر، والتقديم.",
  openGraph: {
    title: "مركز المساعدة | Hello Staff",
    description: "إجابات على أسئلتك حول Hello Staff",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
