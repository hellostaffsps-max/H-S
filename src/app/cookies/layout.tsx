import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة ملفات تعريف الارتباط",
  description: "سياسة ملفات تعريف الارتباط (Cookies) الخاصة بمنصة Hello Staff.",
  openGraph: {
    title: "سياسة ملفات تعريف الارتباط | Hello Staff",
    description: "سياسة استخدام Cookies",
  },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
