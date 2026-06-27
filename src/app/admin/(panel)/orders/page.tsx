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

const statusLabels: Record<string, string> = {
  PENDING_DEPOSIT: "Chờ đặt cọc",
  DEPOSIT_CONFIRMED: "Đã xác nhận cọc",
  PENDING_ONLINE_PAYMENT: "Chờ thanh toán online",
  PAID_FULL: "Đã thanh toán đủ",
  ORDERED_FROM_SUPPLIER: "Đã đặt hàng NCC",
  ARRIVED_AT_SHOP: "Hàng về kho",
  SHIPPING: "Đang giao hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const paymentMethodLabels: Record<string, string> = {
  DEPOSIT_50_BANK_ZALO: "Bank/Zalo (cọc 50%)",
  ONLINE_100_SEPAY: "SePay (100%)",
  ONLINE_100_VNPAY: "VNPay (100%)",
  ONLINE_100_MOMO: "MoMo (100%)",
};

const paymentTypeLabels: Record<string, string> = {
  DEPOSIT: "Cọc",
  REMAINING_BALANCE: "Còn lại",
  FULL_PAYMENT: "Toàn bộ",
  SHIPPING_FEE: "Phí ship",
};

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
        emptyMessage="No orders yet."
        headers={["Order", "Customer", "Items", "Total", "Payment", "Status", "Update"]}
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
            <td className="px-4 py-4 text-sm">
              <p className="font-bold">{order.items.length} sản phẩm</p>
              <p className="mt-1 text-xs text-zinc-500">
                {order.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}
              </p>
            </td>
            <td className="px-4 py-4 font-bold">{formatPrice(order.totalAmount)}</td>
            <td className="px-4 py-4 text-xs">
              <p className="font-bold">
                {paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}
              </p>
              <div className="mt-1 space-y-1">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <span className="text-zinc-500">{paymentTypeLabels[p.paymentType] ?? p.paymentType}:</span>
                    <StatusBadge status={p.paymentStatus} />
                  </div>
                ))}
                {order.payments.length === 0 && (
                  <span className="text-zinc-400">Chưa có thanh toán</span>
                )}
              </div>
            </td>
            <td className="px-4 py-4">
              <StatusBadge status={order.status} />
            </td>
            <td className="px-4 py-4">
              <AdminStatusSelect
                endpoint={`/api/orders/${order.id}`}
                statuses={statuses}
                statusLabels={statusLabels}
                value={order.status}
              />
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
