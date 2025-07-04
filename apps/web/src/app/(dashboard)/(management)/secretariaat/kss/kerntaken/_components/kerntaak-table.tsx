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
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
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

type Kerntaak = {
  id: string;
  titel: string;
  type: "verplicht" | "facultatief";
  rang: number | null;
  kwalificatieprofiel: {
    id: string;
    titel: string;
    richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  };
  onderdelen: Array<{
    id: string;
    type: "portfolio" | "praktijk";
  }>;
};

const columnHelper = createColumnHelper<Kerntaak>();

const formatRichting = (richting: string): string => {
  const richtingLabels = {
    instructeur: "Instructeur",
    leercoach: "Leercoach",
    pvb_beoordelaar: "PVB Beoordelaar",
  };
  return richtingLabels[richting as keyof typeof richtingLabels] || richting;
};

const columns = [
  columnHelper.accessor("titel", {
    header: "Titel",
  }),
  columnHelper.accessor("kwalificatieprofiel", {
    header: "Kwalificatieprofiel",
    cell: ({ getValue }) => {
      const profiel = getValue();
      return (
        <div>
          <div className="font-medium">{profiel.titel}</div>
          <div className="text-xs text-gray-500">
            {formatRichting(profiel.richting)}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => (
      <Badge color={getValue() === "verplicht" ? "blue" : "zinc"}>
        {getValue() === "verplicht" ? "Verplicht" : "Facultatief"}
      </Badge>
    ),
  }),
  columnHelper.accessor("rang", {
    header: "Rang",
    cell: ({ getValue }) => getValue() || "-",
  }),
  columnHelper.accessor("onderdelen", {
    header: "Onderdelen",
    cell: ({ getValue }) => {
      const onderdelen = getValue();
      return (
        <div className="flex gap-1">
          {onderdelen.map((onderdeel) => (
            <Badge key={onderdeel.id} color="zinc" className="text-xs">
              {onderdeel.type === "portfolio" ? "Portfolio" : "Praktijk"}
            </Badge>
          ))}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Acties",
    cell: ({ row }) => (
      <Button
        href={`/secretariaat/kss/kerntaken/${row.original.id}`}
        className="!px-2 !py-1 text-xs"
      >
        Beheren
      </Button>
    ),
  }),
];

export default function KerntaakTable({
  kerntaken,
  totalItems,
  placeholderRows,
}: {
  kerntaken: Kerntaak[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: kerntaken,
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
              {/* Actions will be added when create/update/delete functions are available */}
            </PopoverPanel>
          </Popover>
        ) : null}
        <DefaultTableHead table={table} />
        <TableBody>
          <PlaceholderTableRows table={table} rows={placeholderRows}>
            <NoTableRows table={table}>Geen kerntaken gevonden</NoTableRows>
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
