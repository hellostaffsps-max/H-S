import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description:
    "هل لديك استفسار أو اقتراح؟ تواصل مع فريق Hello Staff وسنكون سعداء بمساعدتك.",
  openGraph: {
    title: "تواصل معنا | Hello Staff",
    description: "تواصل مع فريق دعم Hello Staff",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
