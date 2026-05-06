import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تنبيهات الوظائف",
  description: "احصل على إشعارات فورية بالوظائف التي تناسبك في قطاع الضيافة.",
  openGraph: {
    title: "تنبيهات الوظائف | Hello Staff",
    description: "اشترك في تنبيهات الوظائف",
  },
};

export default function JobAlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
