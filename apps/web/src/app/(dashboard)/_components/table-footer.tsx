"use client";

import type { RowSelectionState, Table } from "@tanstack/react-table";
import { parseAsInteger, useQueryState } from "nuqs";
import type { PropsWithChildren } from "react";
import { Select } from "~/app/(dashboard)/_components/select";
import { PaginationNext, PaginationPrevious } from "./pagination";

const pageSizes =
  process.env.NODE_ENV === "development"
    ? [1, 2, 3, 5, 10, 25, 50, 100, 250]
    : [25, 50, 100, 250];

export function TablePagination({
  totalItems,
  paramPrefix = "",
}: {
  totalItems: number;
  paramPrefix?: string;
}) {
  const pageParam = `${paramPrefix ? `${paramPrefix}-` : ""}page`;
  const limitParam = `${paramPrefix ? `${paramPrefix}-` : ""}limit`;

  const [page, setPage] = useQueryState(
    pageParam,
    parseAsInteger.withDefault(1).withOptions({
      shallow: false,
    }),
  );
  const [limit, setLimit] = useQueryState(
    limitParam,
    parseAsInteger.withDefault(25).withOptions({
      shallow: false,
    }),
  );

  const currentPage = page ?? 1;
  const itemsPerPage = limit ?? 25;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 ml-auto leading-6">
      <span className="hidden sm:inline">Items per pagina:</span>

      <div>
        <Select
          value={itemsPerPage}
          onChange={(event) => {
            setPage(1);
            setLimit(Number(event.target.value));
          }}
        >
          {!pageSizes.includes(itemsPerPage) ? (
            <option key={itemsPerPage} value={itemsPerPage}>
              -
            </option>
          ) : null}
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>

      <span className="hidden sm:inline tabular-nums">
        Pagina {currentPage} van {totalPages}
      </span>

      <div className="flex space-x-1">
        <PaginationPrevious
          disabled={isFirstPage}
          onClick={() => !isFirstPage && setPage(currentPage - 1)}
        >
          Vorige
        </PaginationPrevious>
        <PaginationNext
          disabled={isLastPage}
          onClick={() => !isLastPage && setPage(currentPage + 1)}
        >
          Volgende
        </PaginationNext>
      </div>
    </div>
  );
}

export function TableRowSelection<T>({
  rowSelection,
  table,
  totalItems,
}: {
  rowSelection?: RowSelectionState;
  table: Table<T>;
  totalItems: number;
}) {
  return rowSelection && Object.keys(rowSelection).length > 0 ? (
    <span className="tabular-nums">
      {Object.keys(rowSelection).length} van {table.getRowModel().rows.length}{" "}
      rijen geselecteerd
    </span>
  ) : (
    <span className="tabular-nums">{totalItems} items totaal</span>
  );
}

export function TableFooter({ children }: PropsWithChildren) {
  return (
    <div className="flex sm:flex-row flex-col justify-between items-center gap-4 px-2 py-4 w-full text-xs">
      {children}
    </div>
  );
}
