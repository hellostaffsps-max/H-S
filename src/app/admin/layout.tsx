import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "لوحة الإدارة - Hello Staff",
    template: "%s | لوحة الإدارة",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
