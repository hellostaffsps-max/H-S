import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import LayoutBody from "./LayoutBody";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Hello Staff",
  description: "Hello Staff application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased font-sans`}>
        <LayoutBody>{children}</LayoutBody>
      </body>
    </html>
  );
}
