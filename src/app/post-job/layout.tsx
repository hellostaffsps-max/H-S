import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "نشر وظيفة",
  description: "انشر وظيفة جديدة في قطاع الضيافة ووظّف أفضل الكفاءات في فلسطين.",
  openGraph: {
    title: "نشر وظيفة | Hello Staff",
    description: "انشر وظيفتك القادمة",
  },
};

export default function PostJobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
