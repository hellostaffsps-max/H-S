import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل دخول المشرف",
  description: "بوابة تسجيل دخول المشرفين في Hello Staff.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
