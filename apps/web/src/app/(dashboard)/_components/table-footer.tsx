"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { RowSelectionState, Table } from "@tanstack/react-table";
import type { PropsWithChildren } from "react";
import { Select } from "~/app/(dashboard)/_components/select";
import { useSetQueryParams } from "~/app/(dashboard)/_utils/set-query-params";
import { PaginationNext, PaginationPrevious } from "./pagination";

const pageSizes = [25, 50, 100, 250];

export function TablePagination({ totalItems }: { totalItems: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setQueryParams = useSetQueryParams();

  const currentPage = searchParams.has("page")
    ? Number(searchParams.get("page"))
    : 1;

  const limit = searchParams.has("limit")
    ? Number(searchParams.get("limit"))
    : 25;

  const totalPages = Math.ceil(totalItems / limit);
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 leading-6 ml-auto">
      <span className="hidden sm:inline">Items per pagina:</span>

      <div>
        <Select
          // @ts-expect-error TODO: Fix this
          size="sm"
          value={limit}
          onChange={(event) => {
            router.push(
              setQueryParams({
                page: String(1),
                limit: String(event.target.value),
              }),
            );
          }}
        >
          {!pageSizes.includes(limit) ? (
            <option key={limit} value={limit}>
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
          href={
            !isFirstPage
              ? setQueryParams({ page: String(currentPage - 1) })
              : null
          }
        >
          Vorige
        </PaginationPrevious>
        <PaginationNext
          href={
            !isLastPage
              ? setQueryParams({ page: String(currentPage + 1) })
              : null
          }
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
    <div className="py-4 px-2 flex w-full sm:flex-row flex-col justify-between gap-4 items-center text-xs">
      {children}
    </div>
  );
}
