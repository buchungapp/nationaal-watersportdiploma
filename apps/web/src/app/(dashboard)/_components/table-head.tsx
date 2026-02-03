import {
  ArrowDownIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
} from "@heroicons/react/16/solid";
import {
  flexRender,
  type SortDirection,
  type Table,
} from "@tanstack/react-table";
import clsx from "clsx";
import { TableHead, TableHeader, TableRow } from "./table";

export function DefaultTableHead<T>({ table }: { table: Table<T> }) {
  return (
    <TableHead>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHeader
              key={header.id}
              className={header.column.columnDef.meta?.header?.className}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHeader>
          ))}
        </TableRow>
      ))}
    </TableHead>
  );
}

export function SortableTableHead<T>({ table }: { table: Table<T> }) {
  return (
    <TableHead>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const sortingHandler = header.column.getToggleSortingHandler?.();
            const getAriaSortValue = (isSorted: false | SortDirection) => {
              switch (isSorted) {
                case "asc":
                  return "ascending";
                case "desc":
                  return "descending";
                default:
                  return "none";
              }
            };

            return (
              <TableHeader
                key={header.id}
                onClick={sortingHandler}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && sortingHandler) {
                    sortingHandler(event);
                  }
                }}
                className={clsx(
                  header.column.getCanSort() && "cursor-pointer select-none",
                )}
                tabIndex={header.column.getCanSort() ? 0 : -1}
                aria-sort={getAriaSortValue(header.column.getIsSorted())}
              >
                <div
                  className={
                    header.column.columnDef.enableSorting === false
                      ? header.column.columnDef.meta?.header?.className
                      : "flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 px-3 py-1.5 -mx-3 -my-1.5 rounded-md"
                  }
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {header.column.getCanSort() &&
                    (header.column.getIsSorted() === false ? (
                      <ArrowsUpDownIcon className="opacity-30 size-3 text-slate-900 dark:text-slate-50" />
                    ) : header.column.getIsSorted() === "desc" ? (
                      <ArrowUpIcon
                        className="size-3 text-slate-900 dark:text-slate-50"
                        aria-hidden={true}
                      />
                    ) : (
                      <ArrowDownIcon
                        className="size-3 text-slate-900 dark:text-slate-50"
                        aria-hidden={true}
                      />
                    ))}
                </div>
              </TableHeader>
            );
          })}
        </TableRow>
      ))}
    </TableHead>
  );
}
