"use client";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
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
import type { listCourses, listParentCategories } from "~/lib/nwd";

type Course = Awaited<ReturnType<typeof listCourses>>[number];
type ParentCategory = Awaited<ReturnType<typeof listParentCategories>>[number];

const columnHelper = createColumnHelper<Course>();

export default function CourseTable({
  courses,
  parentCategories,
  totalItems,
  placeholderRows,
}: {
  courses: Course[];
  parentCategories: ParentCategory[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  const columns = useMemo(() => {
    return [
      columnHelper.accessor("title", {
        header: "Naam",
      }),
      columnHelper.accessor("discipline.title", {
        header: "Discipline",
      }),
      ...parentCategories.map((category) =>
        columnHelper.display({
          id: `category-${category.id}`,
          // biome-ignore lint/style/noNonNullAssertion: intentional
          header: category.title!,
          cell: ({ row }) => (
            <div className="flex items-center gap-x-2.5">
              {row.original.categories
                .filter((c) => c.parent?.id === category.id)
                .map((c) => (
                  <Badge key={c.id}>{c.title}</Badge>
                ))}
            </div>
          ),
        }),
      ),
    ];
  }, [courses]);

  const table = useReactTable({
    data: courses,
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
            <DefaultTableRows
              table={table}
              href={(row) =>
                `/secretariaat/diplomalijn/cursussen/${row.original.handle}`
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
    </div>
  );
}
