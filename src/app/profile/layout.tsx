import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الملف الشخصي",
  description: "إدارة ملفك الشخصي، سيرتك الذاتية، وإعدادات حسابك.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
