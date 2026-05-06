import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الرسائل",
  description: "تواصل مع أصحاب العمل والباحثين عن عمل عبر نظام الرسائل في Hello Staff.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
