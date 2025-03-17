"use client";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
} from "~/app/(dashboard)/_components/table-content";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
import type { listDegrees } from "~/lib/nwd";

type Degree = Awaited<ReturnType<typeof listDegrees>>[number];

const columnHelper = createColumnHelper<Degree>();

const columns = [
  columnHelper.accessor("title", {
    header: "Naam",
  }),
  columnHelper.accessor("rang", {
    header: "Level",
  }),
];

export default function ModuleTable({
  degrees,
  totalItems,
}: {
  degrees: Degree[];
  totalItems: number;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: degrees,
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
    <div className="relative mt-8">
      <Table
        dense
        className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
      >
        {anyRowSelected ? (
          <Popover className="top-0 left-12 absolute flex items-center space-x-2">
            <PopoverButton color="branding-orange">
              Acties <ChevronDownIcon />
            </PopoverButton>
            <PopoverPanel anchor="bottom start">
              {/* <Download rows={table.getSelectedRowModel().rows} /> */}
            </PopoverPanel>
          </Popover>
        ) : null}
        <DefaultTableHead table={table} />
        <TableBody>
          <NoTableRows table={table}>Geen items gevonden</NoTableRows>
          <DefaultTableRows table={table}>
            {(cell, index, row) => (
              <DefaultTableCell
                key={cell.id}
                cell={cell}
                index={index}
                row={row}
              />
            )}
          </DefaultTableRows>
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
