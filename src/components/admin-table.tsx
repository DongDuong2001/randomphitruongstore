export function AdminTable({
  headers,
  children
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="bg-[#ebe9e4] text-xs uppercase tracking-wider text-zinc-600">
          <tr>
            {headers.map((header) => (
              <th className="px-4 py-3" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 text-zinc-800 [&>tr]:transition-colors [&>tr:hover]:bg-[#faf9f7]">
          {children}
        </tbody>
      </table>
    </div>
  );
}
