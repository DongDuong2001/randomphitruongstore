import { Fragment, isValidElement, type ReactNode } from "react";

export function AdminTable({
  headers,
  children,
  emptyMessage = "No records found."
}: {
  headers: string[];
  children?: ReactNode;
  emptyMessage?: string;
}) {
  const isEmpty = !hasRenderableContent(children);

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
          {isEmpty ? (
            <tr>
              <td
                className="px-4 py-12 text-center text-sm text-zinc-400"
                colSpan={headers.length}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

function hasRenderableContent(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node === "boolean") {
    return false;
  }

  if (Array.isArray(node)) {
    return node.some(hasRenderableContent);
  }

  if (typeof node === "string") {
    return node.length > 0;
  }

  if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
    return hasRenderableContent(node.props.children);
  }

  return true;
}
