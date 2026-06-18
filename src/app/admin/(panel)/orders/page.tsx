import Link from "next/link";
import { AdminStatusSelect } from "@/components/admin-status-select";
import { AdminTable } from "@/components/admin-table";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statuses = [
  "PENDING_DEPOSIT",
  "DEPOSIT_CONFIRMED",
  "PENDING_ONLINE_PAYMENT",
  "PAID_FULL",
  "ORDERED_FROM_SUPPLIER",
  "ARRIVED_AT_SHOP",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED"
];

export default async function AdminOrdersPage() {
  const orders = await getPrisma().order.findMany({
    include: {
      customer: true,
      items: true,
      payments: { orderBy: { createdAt: "asc" } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow text-zinc-500">Fulfillment</p>
        <h1 className="mt-2 text-4xl font-black">Orders</h1>
      </header>
      <AdminTable
        headers={["Order", "Customer", "Total", "Payment", "Status", "Update"]}
      >
        {orders.map((order) => (
          <tr key={order.id}>
            <td className="px-4 py-4">
              <Link
                className="font-bold underline underline-offset-4"
                href={`/admin/orders/${order.id}`}
              >
                {order.orderNumber}
              </Link>
              <p className="mt-1 text-xs text-zinc-500">
                {order.createdAt.toLocaleDateString("vi-VN")}
              </p>
            </td>
            <td className="px-4 py-4">
              <p className="font-bold">{order.customer.fullName}</p>
              <p className="text-xs text-zinc-500">{order.customer.phone}</p>
            </td>
            <td className="px-4 py-4">{formatPrice(order.subtotal)}</td>
            <td className="px-4 py-4 text-xs">
              <p className="font-bold">{order.paymentMethod}</p>
              <p className="mt-1 text-zinc-500">
                {paymentSummary(order.payments)}
              </p>
            </td>
            <td className="px-4 py-4">
              <StatusBadge status={order.status} />
            </td>
            <td className="px-4 py-4">
              <AdminStatusSelect
                endpoint={`/api/orders/${order.id}`}
                statuses={statuses}
                value={order.status}
              />
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}

function paymentSummary(
  payments: Array<{ paymentType: string; paymentStatus: string }>
) {
  if (payments.length === 0) {
    return "No payment record";
  }

  return payments
    .map(
      (payment) =>
        `${payment.paymentType.replaceAll("_", " ")}: ${payment.paymentStatus}`
    )
    .join(" / ");
}
