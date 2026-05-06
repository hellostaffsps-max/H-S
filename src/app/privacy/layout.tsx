import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "كيف نجمع بياناتك ونحميها. سياسة الخصوصية الخاصة بمنصة Hello Staff.",
  openGraph: {
    title: "سياسة الخصوصية | Hello Staff",
    description: "كيف نحمي بياناتك في Hello Staff",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
