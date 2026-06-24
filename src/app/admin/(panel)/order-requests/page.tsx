import Image from "next/image";
import { AdminStatusSelect } from "@/components/admin-status-select";
import { AdminTable } from "@/components/admin-table";
import { StatusBadge } from "@/components/status-badge";
import { getPrisma } from "@/lib/prisma";
import {
  adminInquiryPresentationUrls,
  listAdminProductInquiries
} from "@/lib/product-inquiry";

export const dynamic = "force-dynamic";

const statuses = ["NEW", "CONTACTED", "QUOTED", "CLOSED"];

export default async function AdminProductInquiriesPage() {
  const requests = await listAdminProductInquiries(getPrisma());

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow text-zinc-500">Custom sourcing</p>
        <h1 className="mt-2 text-4xl font-black">Order requests</h1>
      </header>
      <AdminTable
        emptyMessage="No order requests yet."
        headers={["Inspiration", "Customer", "Request", "Status", "Update"]}
      >
        {requests.map((request) => {
          const { imageUrl, linkUrl } = adminInquiryPresentationUrls(request);
          const socialContact =
            request.instagramHandle ?? request.zaloPhone ?? request.email ?? "-";

          return (
            <tr key={request.id}>
              <td className="px-4 py-4">
                {imageUrl ? (
                  <a href={linkUrl ?? imageUrl} rel="noreferrer" target="_blank">
                    <Image
                      alt="Customer inspiration"
                      className="h-20 w-16 object-cover"
                      height={80}
                      src={imageUrl}
                      width={64}
                    />
                  </a>
                ) : linkUrl ? (
                  <a
                    className="text-xs font-bold text-[#a72b1f] underline"
                    href={linkUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open link
                  </a>
                ) : (
                  <span className="text-xs text-zinc-500">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                <p className="font-bold">{request.fullName}</p>
                <p className="text-xs text-zinc-500">{request.phone}</p>
                <p className="text-xs text-zinc-500">{socialContact}</p>
              </td>
              <td className="max-w-xs px-4 py-4">
                <p>Size: {request.preferredSize ?? "-"}</p>
                <p>Color: {request.preferredColor ?? "-"}</p>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {request.customerMessage || "-"}
                </p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={request.status} />
              </td>
              <td className="px-4 py-4">
                <AdminStatusSelect
                  endpoint={`/api/order-requests/${request.id}`}
                  statuses={statuses}
                  value={request.status}
                />
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </>
  );
}
