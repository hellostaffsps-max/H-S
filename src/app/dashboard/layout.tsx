import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة التحكم",
  description: "إدارة وظائفك، طلبات التوظيف، ونشاطك على منصة Hello Staff.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
