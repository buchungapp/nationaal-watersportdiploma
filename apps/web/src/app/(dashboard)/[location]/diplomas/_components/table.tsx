"use client";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import clsx from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import type { listCertificates } from "~/lib/nwd";

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
    enableSorting: false,
    meta: {
      align: "text-left",
    },
  }),
  columnHelper.accessor("handle", {
    header: "Nummer",
    meta: {
      align: "text-left",
    },
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
      meta: {
        align: "text-left",
      },
      cell: ({ getValue }) => (
        <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {getValue()}
        </span>
      ),
    },
  ),
  columnHelper.accessor("program.title", {
    header: "Programma",
    meta: {
      align: "text-left",
    },
  }),
  columnHelper.accessor("gearType.title", {
    header: "Boottype",
    meta: {
      align: "text-left",
    },
  }),
  columnHelper.accessor("issuedAt", {
    header: "Behaald op",
    meta: {
      align: "text-left",
    },
    cell: ({ getValue }) => dayjs(getValue()).format("DD-MM-YYYY"),
  }),
];

export default function CertificateTable({
  certificates,
}: {
  certificates: Certificate[];
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

  return (
    <>
      <Table className="mt-8">
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-tremor-border dark:border-dark-tremor-border"
            >
              {headerGroup.headers.map((header) => (
                <TableHeaderCell
                  key={header.id}
                  className={clsx(header.column.columnDef.meta?.align)}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHeaderCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => row.toggleSelected(!row.getIsSelected())}
              className="group select-none hover:bg-tremor-background-muted hover:dark:bg-dark-tremor-background-muted"
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={clsx(
                    row.getIsSelected()
                      ? "bg-tremor-background-muted dark:bg-dark-tremor-background-muted"
                      : "",
                    cell.column.columnDef.meta?.align,
                    "relative",
                  )}
                >
                  {index === 0 && row.getIsSelected() && (
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-tremor-brand dark:bg-dark-tremor-brand" />
                  )}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        {/* <TableFoot>
          <TableRow>
            <TableHeaderCell colSpan={1}>
              <Checkbox
                {...{
                  checked: table.getIsAllPageRowsSelected(),
                  indeterminate: table.getIsSomePageRowsSelected(),
                  onChange: table.getToggleAllPageRowsSelectedHandler(),
                }}
                className="-translate-y-[1px]"
              />
            </TableHeaderCell>
            <TableHeaderCell colSpan={7} className="font-normal tabular-nums">
              {Object.keys(rowSelection).length} of{" "}
              {table.getRowModel().rows.length} Page Row(s) selected
            </TableHeaderCell>
          </TableRow>
        </TableFoot> */}
      </Table>
    </>
  );
}
