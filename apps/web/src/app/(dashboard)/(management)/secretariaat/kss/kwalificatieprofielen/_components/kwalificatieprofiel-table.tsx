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

type Kwalificatieprofiel = {
  id: string;
  titel: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  niveau: {
    id: string;
    rang: number;
  };
  niveauRang?: number;
  kerntaken: Array<{
    id: string;
    titel: string;
    type: "verplicht" | "facultatief";
    rang: number | null;
    onderdelen: Array<{
      id: string;
      type: "portfolio" | "praktijk";
    }>;
  }>;
};

const columnHelper = createColumnHelper<Kwalificatieprofiel>();

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
  columnHelper.accessor("richting", {
    header: "Richting",
    cell: ({ getValue }) => (
      <Badge color="blue">{formatRichting(getValue())}</Badge>
    ),
  }),
  columnHelper.accessor("niveau.rang", {
    header: "Niveau",
    cell: ({ getValue }) => `Niveau ${getValue()}`,
  }),
  columnHelper.accessor("kerntaken", {
    header: "Aantal kerntaken",
    cell: ({ getValue }) => getValue().length,
  }),
];

export default function KwalificatieprofielTable({
  kwalificatieprofielen,
  totalItems,
  placeholderRows,
}: {
  kwalificatieprofielen: Kwalificatieprofiel[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: kwalificatieprofielen,
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
            <NoTableRows table={table}>
              Geen kwalificatieprofielen gevonden
            </NoTableRows>
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
