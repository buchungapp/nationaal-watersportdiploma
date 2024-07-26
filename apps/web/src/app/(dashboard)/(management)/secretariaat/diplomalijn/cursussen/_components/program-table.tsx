"use client";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import type { listPrograms } from "~/lib/nwd";

type Program = Awaited<ReturnType<typeof listPrograms>>[number];

const columnHelper = createColumnHelper<Program>();

export default function ProgramTable({
  programs,
  totalItems,
}: {
  programs: Program[];
  totalItems: number;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(() => {
    return [
      columnHelper.accessor("course.title", {
        header: "Cursus",
      }),
      columnHelper.accessor("degree.title", {
        header: "Niveau",
      }),
    ];
  }, [programs]);

  const table = useReactTable({
    data: programs,
    columns,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      rowSelection,
    },
  });

  const anyRowSelected =
    table.getIsAllRowsSelected() || table.getIsSomeRowsSelected();

  return (
    <div className="mt-8 relative">
      <Table
        dense
        className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]"
      >
        {anyRowSelected ? (
          <Popover className="absolute left-12 top-0 flex items-center space-x-2">
            <PopoverButton color="branding-orange">
              Acties <ChevronDownIcon />
            </PopoverButton>
            <PopoverPanel anchor="bottom start">
              {/* <Download rows={table.getSelectedRowModel().rows} /> */}
            </PopoverPanel>
          </Popover>
        ) : null}
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeader
                  key={header.id}
                  header={header}
                  className={clsx(header.column.columnDef.meta?.align)}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHeader>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowCount() <= 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                Geen items gevonden
              </TableCell>
            </TableRow>
          ) : null}
          {table.getRowModel().rows.map((row) => (
            <TableRow
              className={clsx(
                row.getIsSelected()
                  ? "bg-zinc-950/[1.5%] dark:bg-zinc-950/[1.5%]"
                  : "",
              )}
              key={row.id}
              href={`/secretariaat/diplomalijn/cursussen/programmas/${row.original.handle}`}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={clsx(cell.column.columnDef.meta?.align)}
                  // TODO: re-enable when we have a proper solution for this
                  // suppressLinkBehavior={
                  //   cell.column.columnDef.meta?.suppressLinkBehavior
                  // }
                >
                  {index === 0 && row.getIsSelected() && (
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-branding-light" />
                  )}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TableFooter>
        <TableRowSelection
          table={table}
          rowSelection={rowSelection}
          totalItems={totalItems}
        />
        <TablePagination totalItems={totalItems} />
      </TableFooter>
    </div>
  );
}
