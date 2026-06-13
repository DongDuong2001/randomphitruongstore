"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminStatusSelect({
  endpoint,
  value,
  statuses
}: {
  endpoint: string;
  value: string;
  statuses: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function update(status: string) {
    setPending(true);
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setPending(false);
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <select
      className="min-h-10 min-w-44 border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-900 outline-none transition-colors hover:border-zinc-500 focus:border-[#a72b1f] focus:ring-2 focus:ring-[#a72b1f]/15 disabled:cursor-wait disabled:bg-zinc-100 disabled:text-zinc-400"
      disabled={pending}
      onChange={(event) => update(event.target.value)}
      value={value}
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {status.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
