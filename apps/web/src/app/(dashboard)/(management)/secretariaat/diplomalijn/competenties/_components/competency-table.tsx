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
import { CompetencyTypeBadge } from "~/app/(dashboard)/_components/badges";
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
  PlaceholderTableRows,
} from "~/app/(dashboard)/_components/table-content";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
import type { listCompetencies } from "~/lib/nwd";
import { EditCompetencyDialog } from "./dialogs/edit-competency-dialog";

type Competency = Awaited<ReturnType<typeof listCompetencies>>[number];

const columnHelper = createColumnHelper<Competency>();

const columns = [
  columnHelper.accessor("title", {
    header: "Naam",
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => {
      return <CompetencyTypeBadge type={getValue()} />;
    },
  }),
  columnHelper.accessor("weight", {
    header: "Sortering",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex justify-end items-center gap-x-2">
          <EditCompetencyDialog
            competency={{
              id: row.original.id,
              title: row.original.title,
              type: row.original.type,
              weight: row.original.weight,
            }}
          />
        </div>
      );
    },
  }),
];

export default function CompetencyTable({
  competencies,
  totalItems,
  placeholderRows,
}: {
  competencies: Competency[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: competencies,
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
          <PlaceholderTableRows table={table} rows={placeholderRows}>
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
          </PlaceholderTableRows>
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
