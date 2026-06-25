import { Children, Fragment, isValidElement } from "react";
import type { ReactNode } from "react";

function hasRenderableChildren(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return hasRenderableChildren(child.props.children);
    }

    return true;
  });
}

export function AdminTable({
  headers,
  children,
  emptyMessage = "No records found."
}: {
  headers: string[];
  children?: ReactNode;
  emptyMessage?: string;
}) {
  const isEmpty = !hasRenderableChildren(children);

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
