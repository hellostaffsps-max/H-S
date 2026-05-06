import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "نصائح المقابلات",
  description:
    "نصائح عملية لنجاح مقابلات العمل في قطاع الضيافة. استعد للمقابلة وانطلق في مسيرتك المهنية.",
  openGraph: {
    title: "نصائح المقابلات | Hello Staff",
    description: "استعد لمقابلة العمل القادمة",
  },
};

export default function InterviewTipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
