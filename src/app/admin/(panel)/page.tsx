import { ClipboardList, HandCoins, Package, Shirt } from "lucide-react";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [products, orders, pendingDeposit, requests] = await Promise.all([
    getPrisma().product.count(),
    getPrisma().order.count(),
    getPrisma().order.count({ where: { status: "PENDING_DEPOSIT" } }),
    getPrisma().orderRequest.count()
  ]);
  const stats = [
    { label: "Total products", value: products, icon: Shirt },
    { label: "Total orders", value: orders, icon: Package },
    { label: "Pending deposit", value: pendingDeposit, icon: HandCoins },
    { label: "Order requests", value: requests, icon: ClipboardList }
  ];

  return (
    <>
      <header>
        <p className="eyebrow text-zinc-500">Overview</p>
        <h1 className="mt-2 text-4xl font-black">Dashboard</h1>
      </header>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              className="border border-zinc-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
              key={stat.label}
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {stat.label}
                </span>
                <Icon size={18} />
              </div>
              <p className="mt-8 text-4xl font-black">{stat.value}</p>
            </article>
          );
        })}
      </section>
    </>
  );
}
