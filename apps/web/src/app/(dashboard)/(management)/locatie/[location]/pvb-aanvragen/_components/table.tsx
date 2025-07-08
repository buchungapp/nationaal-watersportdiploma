"use client";
import { formatters } from "@nawadi/lib";
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
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import { TableSelection } from "~/app/(dashboard)/_components/table-action";
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
import { Code } from "~/app/(dashboard)/_components/text";
import type { listPvbs } from "~/lib/nwd";
import { PvbTableActions } from "./pvb-table-actions";

type PvbAanvraag = Awaited<ReturnType<typeof listPvbs>>[number];

// Status badge colors
const statusColors: Record<
  PvbAanvraag["status"],
  keyof typeof import("~/app/(dashboard)/_components/badge").colors
> = {
  concept: "zinc",
  wacht_op_voorwaarden: "yellow",
  gereed_voor_beoordeling: "blue",
  in_beoordeling: "purple",
  afgerond: "green",
  ingetrokken: "zinc",
  afgebroken: "red",
} as const;

// Status display names
const statusDisplayNames = {
  concept: "Concept",
  wacht_op_voorwaarden: "Wacht op voorwaarden",
  gereed_voor_beoordeling: "Gereed voor beoordeling",
  in_beoordeling: "In beoordeling",
  afgerond: "Afgerond",
  ingetrokken: "Ingetrokken",
  afgebroken: "Afgebroken",
} as const;

const columnHelper = createColumnHelper<PvbAanvraag>();

const columns = [
  columnHelper.display({
    id: "select",
    cell: ({ row }) => (
      <CheckboxField>
        <Checkbox
          {...{
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
          className="-translate-y-[1px]"
        />
      </CheckboxField>
    ),
    header: ({ table }) => (
      <CheckboxField>
        <Checkbox
          {...{
            disabled: false,
            checked:
              table.getIsSomePageRowsSelected() ||
              table.getIsAllPageRowsSelected(),
            indeterminate: !table.getIsAllPageRowsSelected(),
            onChange: (checked) => table.toggleAllPageRowsSelected(checked),
          }}
          className="-translate-y-[1px]"
        />
      </CheckboxField>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("handle", {
    header: "ID",
    cell: ({ getValue }) => <Code>{getValue()}</Code>,
  }),
  columnHelper.accessor((data) => formatters.formatPersonName(data.kandidaat), {
    header: "Kandidaat",
    cell: ({ getValue }) => (
      <span className="font-medium text-zinc-950">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge color={statusColors[status]}>{statusDisplayNames[status]}</Badge>
      );
    },
  }),

  columnHelper.accessor(
    (data) =>
      data.leercoach ? formatters.formatPersonName(data.leercoach) : null,
    {
      id: "leercoach",
      header: "Leercoach",
      cell: ({ getValue }) => {
        const name = getValue();
        return name ? (
          <span className="text-zinc-700">{name}</span>
        ) : (
          <span className="text-zinc-400 italic">Niet toegewezen</span>
        );
      },
    },
  ),
  columnHelper.accessor(
    (data) => {
      // Get unique beoordelaars from kerntaakOnderdelen
      const beoordelaars = data.kerntaakOnderdelen
        .map((onderdeel) => onderdeel.beoordelaar)
        .filter(
          (beoordelaar): beoordelaar is NonNullable<typeof beoordelaar> =>
            beoordelaar !== null,
        )
        .map((beoordelaar) => formatters.formatPersonName(beoordelaar))
        .filter((name, index, self) => self.indexOf(name) === index);
      return beoordelaars;
    },
    {
      id: "beoordelaars",
      header: "Beoordelaar(s)",
      cell: ({ getValue }) => {
        const beoordelaars = getValue();
        if (beoordelaars.length === 0) {
          return <span className="text-zinc-400 italic">Niet toegewezen</span>;
        }
        return (
          <div className="flex flex-col gap-0.5">
            {beoordelaars.map((name) => (
              <span key={name} className="text-zinc-700 text-sm">
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
  ),
  columnHelper.accessor((data) => data.hoofdcursus, {
    id: "hoofdcursus",
    header: "Hoofdcursus",
    cell: ({ getValue }) => {
      const cursus = getValue();
      return cursus ? (
        <span className="font-medium text-zinc-900">
          {cursus.code ?? cursus.title}
        </span>
      ) : (
        <span className="text-zinc-400 italic">Geen hoofdcursus</span>
      );
    },
  }),
  columnHelper.accessor((data) => data.kwalificatieprofielen, {
    id: "kwalificatieprofielen",
    header: "Kwalificatieprofielen",
    cell: ({ getValue }) => {
      const profielen = getValue();
      if (profielen.length === 0) {
        return <span className="text-zinc-400 italic">Geen</span>;
      }
      return (
        <div className="flex flex-col gap-0.5">
          {profielen.map((profiel) => (
            <span key={profiel.id} className="text-zinc-700 text-sm">
              {profiel.titel} - {profiel.richting}
            </span>
          ))}
        </div>
      );
    },
  }),
  columnHelper.accessor("opmerkingen", {
    header: "Opmerkingen",
    cell: ({ getValue }) => {
      const opmerkingen = getValue();
      return opmerkingen ? (
        <span className="text-zinc-700 truncate max-w-xs">{opmerkingen}</span>
      ) : (
        <span className="text-zinc-400">-</span>
      );
    },
  }),
];

interface PvbTableProps {
  pvbs: PvbAanvraag[];
  totalItems: number;
  placeholderRows?: number;
  location: {
    id: string;
    handle: string;
  };
}

export default function PvbTable({
  pvbs,
  totalItems,
  placeholderRows,
  location,
}: PvbTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: pvbs,
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

  const selectedRows = Object.keys(rowSelection);
  const selectedPvbs = pvbs.filter((pvb) => selectedRows.includes(pvb.id));

  return (
    <div className="relative mt-8">
      <Table
        dense
        className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
      >
        <DefaultTableHead table={table} />
        <TableBody>
          <PlaceholderTableRows table={table} rows={placeholderRows}>
            <NoTableRows table={table}>Geen items gevonden</NoTableRows>
            <DefaultTableRows
              table={table}
              href={(row) =>
                `/locatie/${location.handle}/pvb-aanvragen/${row.original.handle}`
              }
            >
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

      <TableSelection
        selectedRows={selectedRows.length}
        clearRowSelection={() => setRowSelection({})}
      >
        <PvbTableActions
          selectedPvbs={selectedPvbs}
          locationId={location.id}
          locationHandle={location.handle}
          onClearSelection={() => setRowSelection({})}
        />
      </TableSelection>
    </div>
  );
}
