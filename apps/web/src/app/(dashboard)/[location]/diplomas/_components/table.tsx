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
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
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
import { Code } from "~/app/(dashboard)/_components/text";
import type { listCertificatesByLocation } from "~/lib/nwd";
import { Download } from "./table-actions";

type Certificate = Awaited<
  ReturnType<typeof listCertificatesByLocation>
>[number];

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
    meta: {
      suppressLinkBehavior: true,
    },
  }),
  columnHelper.accessor("handle", {
    header: "Nummer",
    cell: ({ getValue, row }) => (
      <Link href={`/diploma/${row.original.id}/pdf`}>
        <Code>{getValue()}</Code>
      </Link>
    ),
    meta: {
      suppressLinkBehavior: true,
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
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
      ),
    },
  ),
  columnHelper.accessor("program.title", {
    header: "Programma",
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
}: {
  certificates: Certificate[];
  totalItems: number;
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

  const anyRowSelected =
    table.getIsAllRowsSelected() || table.getIsSomeRowsSelected();

  return (
    <div className="mt-10 relative">
      {anyRowSelected ? (
        <Popover className="absolute left-12 top-0 flex items-center space-x-2">
          <PopoverButton color="branding-orange">
            Acties <ChevronDownIcon />
          </PopoverButton>
          <PopoverPanel anchor="bottom start">
            <Download rows={table.getSelectedRowModel().rows} />
          </PopoverPanel>
        </Popover>
      ) : null}
      <Table dense>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeader
                  key={header.id}
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
              href={`#TODO`}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={clsx(cell.column.columnDef.meta?.align)}
                  suppressLinkBehavior={
                    cell.column.columnDef.meta?.suppressLinkBehavior
                  }
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
