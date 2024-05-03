"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Select } from "~/app/(dashboard)/_components/select";
import { useSetQueryParams } from "~/app/(dashboard)/_utils/set-query-params";

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
    <div className="flex items-center space-x-2 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
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
          <option value="5">5</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="250">250</option>
        </Select>
      </div>

      <span className="hidden sm:inline">
        Pagina {currentPage} van {totalPages}
      </span>

      <div className="space-x-1">
        <button
          onClick={(event) => {
            if (isFirstPage) event.preventDefault();
            router.push(setQueryParams({ page: String(currentPage - 1) }));
          }}
          disabled={isFirstPage}
          className={`inline-flex items-center gap-x-1.5 rounded-md border border-zinc-950/10 bg-white px-2 py-1.5 text-xs font-medium text-zinc-900 ${
            isFirstPage ? "cursor-not-allowed text-zinc-900/20" : ""
          }`}
        >
          Vorige
        </button>

        <button
          onClick={(event) => {
            if (isLastPage) event.preventDefault();
            router.push(setQueryParams({ page: String(currentPage + 1) }));
          }}
          disabled={isLastPage}
          className={`inline-flex items-center gap-x-1.5 rounded-md bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white ${
            isLastPage ? "cursor-not-allowed opacity-20" : ""
          }`}
        >
          Volgende
        </button>
      </div>
    </div>
  );
}
