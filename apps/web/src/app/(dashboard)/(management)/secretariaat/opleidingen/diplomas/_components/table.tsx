"use client";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";
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
import dayjs from "~/lib/dayjs";
import type { listCertificates } from "~/lib/nwd";
import { ActionButtons } from "./table-actions";

type Certificate = Awaited<ReturnType<typeof listCertificates>>[number];

const columnHelper = createColumnHelper<Certificate>();

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
    header: "Nummer",
    cell: ({ getValue, row }) => (
      <Link
        href={`/diploma/${row.original.id}?nummer=${row.original.handle}&datum=${dayjs(row.original.issuedAt).format("YYYYMMDD")}`}
        target="_blank"
      >
        <Code linkable>{getValue()}</Code>
      </Link>
    ),
  }),
  columnHelper.accessor(
    (data) =>
      [
        data.student.firstName,
        data.student.lastNamePrefix,
        data.student.lastName,
      ]
        .filter(Boolean)
        .join(" "),
    {
      header: "Cursist",
      cell: ({ getValue, row }) => (
        <Link
          href={`/secretariaat/gebruikers/${row.original.student.id}`}
          target="_blank"
          className="flex items-center gap-x-1 font-medium hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
        >
          {getValue()} <ArrowTopRightOnSquareIcon className="size-4" />
        </Link>
      ),
    },
  ),
  columnHelper.accessor("location.name", {
    header: "Locatie",
    cell: ({ getValue, row }) => (
      <Link
        href={`/secretariaat/locaties/${row.original.location.id}`}
        target="_blank"
        className="flex items-center gap-x-1 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
      >
        {getValue()} <ArrowTopRightOnSquareIcon className="size-4" />
      </Link>
    ),
  }),
  columnHelper.accessor("program.course.title", {
    header: "Cursus",
  }),
  columnHelper.accessor("program.degree.title", {
    header: "Niveau",
  }),
  columnHelper.accessor("gearType.title", {
    header: "Boottype",
  }),
  columnHelper.accessor("issuedAt", {
    header: "Behaald op",
    cell: ({ getValue }) => {
      const issuedAt = getValue();

      return issuedAt ? (
        <span className="tabular-nums">
          {dayjs(issuedAt).format("DD-MM-YYYY")}
        </span>
      ) : null;
    },
  }),
];

export default function CertificateTable({
  certificates,
  totalItems,
  placeholderRows,
}: {
  certificates: Certificate[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: certificates,
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

  const selectedRows = Object.keys(rowSelection).length;
  const actionRows = certificates.filter(
    (certificate) => rowSelection[certificate.id],
  );

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

      <TableSelection
        selectedRows={selectedRows}
        clearRowSelection={() => setRowSelection({})}
      >
        <ActionButtons
          rows={actionRows}
          resetSelection={() => setRowSelection({})}
        />
      </TableSelection>
    </div>
  );
}
