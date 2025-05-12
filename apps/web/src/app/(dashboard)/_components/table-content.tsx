import { type Row, type Table, flexRender } from "@tanstack/react-table";
import type { Cell } from "@tanstack/react-table";
import type { PropsWithChildren } from "react";
import { TableCell, TableRow } from "./table";

export function NoTableRows<T>({
  table,
  children,
}: PropsWithChildren<{ table: Table<T> }>) {
  if (table.getRowCount() > 0) return null;

  return (
    <TableRow>
      <TableCell colSpan={table.getAllColumns().length} className="text-center">
        {children}
      </TableCell>
    </TableRow>
  );
}

export function DefaultTableRows<T>({
  table,
  className,
  href,
  target,
  title,
  children,
}: {
  table: Table<T>;
  className?: string;
  href?: string | ((row: Row<T>) => string);
  target?: string | ((row: Row<T>) => string);
  title?: string | ((row: Row<T>) => string);
  children: (
    cell: Cell<T, unknown>,
    index: number,
    row: Row<T>,
  ) => React.ReactNode;
}) {
  return table.getRowModel().rows.map((row) => (
    <TableRow
      className={className}
      key={row.id}
      selected={row.getIsSelected()}
      target={typeof target === "function" ? target(row) : target}
      href={typeof href === "function" ? href(row) : href}
      title={typeof title === "function" ? title(row) : title}
    >
      {row.getVisibleCells().map((cell, index) => children(cell, index, row))}
    </TableRow>
  ));
}

export function DefaultTableCell<T>({
  cell,
  index,
  row,
}: {
  cell: Cell<T, unknown>;
  index: number;
  row: Row<T>;
}) {
  return (
    <TableCell
      key={cell.id}
      className={cell.column.columnDef.meta?.cell?.className}
    >
      {index === 0 && row.getIsSelected() && (
        <div className="left-0 absolute inset-y-0 bg-branding-light w-0.5" />
      )}
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
}

export function PlaceholderTableRows<T>({
  table,
  colSpan,
  rows,
  children,
}: PropsWithChildren<
  (
    | { table: Table<T>; colSpan?: never }
    | { table?: never; colSpan: number }
  ) & { rows?: number }
>) {
  if (rows && rows > 0) {
    return [...Array(rows)].map((_, index) => (
      <tr
        // biome-ignore lint/suspicious/noArrayIndexKey: no other option
        key={`logbook-table-placeholder-${index}`}
      >
        <td colSpan={colSpan ?? table.getAllColumns().length}>
          <span
            className="block bg-slate-200 mt-2 rounded w-full h-9.25 animate-pulse"
            style={{
              animationDelay: `${index * 0.3}s`,
            }}
          />
        </td>
      </tr>
    ));
  }

  return children;
}
