import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminStatusSelect } from "@/components/admin-status-select";
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

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      shippingAddress: true
    }
  });
  if (!order) {
    notFound();
  }
  const shippingAddress =
    order.shippingAddress?.fullAddress ??
    `${order.customer.address}, ${order.customer.ward}, ${order.customer.district}, ${order.customer.province}`;
  const recipientName = order.shippingAddress?.recipientName ?? order.customer.fullName;
  const recipientPhone = order.shippingAddress?.phone ?? order.customer.phone;

  return (
    <>
      <Link className="text-xs font-bold uppercase text-zinc-500" href="/admin/orders">
        ← Back to orders
      </Link>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zinc-500">Order detail</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {order.orderNumber}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <AdminStatusSelect
            endpoint={`/api/orders/${order.id}`}
            statuses={statuses}
            value={order.status}
          />
        </div>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="border border-zinc-200 bg-white p-5">
          <h2 className="font-black">Customer</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Detail label="Name" value={recipientName} />
            <Detail label="Phone" value={recipientPhone} />
            <Detail label="Address" value={shippingAddress} />
            <Detail label="Shipping" value={order.shippingRegion} />
            <Detail label="Note" value={order.note || "-"} />
          </dl>
        </section>
        <section className="border border-zinc-200 bg-white p-5">
          <h2 className="font-black">Payment</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Detail label="Method" value={order.paymentMethod} />
            <Detail label="Subtotal" value={formatPrice(order.subtotal)} />
            <Detail
              label="Deposit"
              value={order.depositAmount ? formatPrice(order.depositAmount) : "-"}
            />
            <Detail
              label="Created"
              value={order.createdAt.toLocaleString("vi-VN")}
            />
          </dl>
        </section>
      </div>

      <section className="mt-5 border border-zinc-200 bg-white p-5">
        <h2 className="font-black">Items</h2>
        <div className="mt-4 divide-y divide-zinc-200">
          {order.items.map((item) => (
            <div
              className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_auto]"
              key={item.id}
            >
              <div>
                <p className="font-bold">{item.productName}</p>
                <p className="mt-1 text-zinc-500">
                  Size {item.size} / {item.color} / Qty {item.quantity}
                </p>
              </div>
              <p className="font-bold">{formatPrice(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
