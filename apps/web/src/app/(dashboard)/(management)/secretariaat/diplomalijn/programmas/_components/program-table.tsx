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
import { Badge } from "~/app/(dashboard)/_components/badge";
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
    const uniqueParentCategories = new Map<
      string,
      {
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        id: string;
        handle: string;
        description: string | null;
        title: string | null;
        weight: number;
      }
    >();

    programs.forEach((program) => {
      program.categories.forEach((category) => {
        !!category.parent &&
          uniqueParentCategories.set(category.parent.id, category.parent);
      });
    });

    return [
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
      columnHelper.accessor("title", {
        header: "Naam",
      }),
      columnHelper.accessor("discipline.title", {
        header: "Discipline",
      }),
      columnHelper.accessor("degree.title", {
        header: "Niveau",
      }),
      ...Array.from(uniqueParentCategories.values()).map((category) =>
        columnHelper.display({
          id: category.id,
          header: category.title!,
          cell: ({ row }) =>
            row.original.categories
              .filter((c) => c.parent?.id === category.id)
              .map((c) => <Badge>{c.title}</Badge>),
        }),
      ),
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
