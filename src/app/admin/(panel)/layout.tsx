import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createPerfContext, withPerfTiming } from "@/lib/perf-diagnostics";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false }
};

export default async function AdminPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const perf = createPerfContext("admin.layout");
  const authenticated = await withPerfTiming(
    perf,
    "admin.session.validate",
    () => isAdminAuthenticated()
  );

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell min-h-screen bg-[#f3f2ef] text-zinc-950 lg:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-4 sm:p-7 lg:p-10">{children}</main>
    </div>
  );
}
