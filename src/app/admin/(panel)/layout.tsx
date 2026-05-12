import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/admin-auth";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: {
    default: "لوحة الإدارة",
    template: "%s | لوحة الإدارة",
  },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await verifyAdmin();

  if (!auth.isAdmin) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutClient 
      adminName={auth.profile?.full_name || "المشرف"}
      permissions={auth.permissions}
      isSuperAdmin={auth.isSuperAdmin}
    >
      {children}
    </AdminLayoutClient>
  );
}
