import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const completed = ["COMPLETED", "PAID_FULL", "CLOSED", "PAID"].includes(status);
  const danger = ["CANCELLED", "FAILED", "REFUNDED"].includes(status);
  const active = [
    "DEPOSIT_CONFIRMED",
    "ORDERED_FROM_SUPPLIER",
    "ARRIVED_AT_SHOP",
    "SHIPPING",
    "CONTACTED",
    "QUOTED"
  ].includes(status);

  return (
    <span
      className={cn(
        "inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
        completed && "bg-emerald-100 text-emerald-800",
        danger && "bg-red-100 text-red-800",
        active && "bg-blue-100 text-blue-800",
        !completed && !danger && !active && "bg-amber-100 text-amber-800"
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
