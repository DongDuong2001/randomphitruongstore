"use client";

import { ClipboardList, LayoutDashboard, LogOut, Package, Settings, Shirt } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Shirt },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/order-requests", label: "Order requests", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside className="border-b border-white/10 bg-[#171715] p-4 text-white lg:sticky lg:top-0 lg:min-h-screen lg:w-64 lg:self-start lg:border-b-0">
      <Link className="block px-3 py-3 text-lg font-black" href="/">
        random.phitruong
      </Link>
      <p className="mb-6 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        Admin workspace
      </p>
      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              className={cn(
                "flex min-h-11 items-center gap-3 border border-transparent px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white/65 transition-colors hover:border-white/10 hover:bg-white/10 hover:text-white",
                active &&
                  "border-[#bd3a2d] bg-[#a72b1f] text-white hover:border-[#bd3a2d] hover:bg-[#8f241a] hover:text-white"
              )}
              href={link.href}
              key={link.href}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        className="mt-6 flex min-h-11 w-full items-center gap-3 border border-transparent px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white/50 transition-colors hover:border-white/10 hover:bg-white/10 hover:text-white"
        onClick={logout}
        type="button"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  );
}
