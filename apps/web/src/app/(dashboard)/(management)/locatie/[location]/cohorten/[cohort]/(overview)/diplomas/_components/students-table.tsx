"use client";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import type {
  OnChangeFn,
  RowSelectionState,
  SortDirection,
  SortingState,
} from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useParams } from "next/navigation";
import {
  createParser,
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from "nuqs";
import React, { useMemo } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
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
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { Code } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import type { listCertificateOverviewByCohortId } from "~/lib/nwd";
import {
  generateSortingState,
  transformSelectionState,
} from "~/utils/table-state";
import { ActionButtons } from "./table-actions";

export type Student = Awaited<
  ReturnType<typeof listCertificateOverviewByCohortId>
>[number];

const parseAsSelection = createParser<Record<string, boolean>>({
  parse(queryValue) {
    const columnKeys = queryValue.split(",");
    return columnKeys.reduce<Record<string, boolean>>(
      (acc, key) => ((acc[key] = true), acc),
      {},
    );
  },
  serialize(value) {
    return Object.keys(value)
      .filter((key) => !!value[key])
      .join(",");
  },
});

const columnHelper = createColumnHelper<Student>();

export default function StudentsTable({
  cohortId,
  students,
  selectedStudents,
  totalItems,
  noOptionsLabel = "Geen items gevonden",
  defaultCertificateVisibleFromDate,
  progressTrackingEnabled,
}: {
  cohortId: string;
  students: Awaited<ReturnType<typeof listCertificateOverviewByCohortId>>;
  selectedStudents: Awaited<
    ReturnType<typeof listCertificateOverviewByCohortId>
  >;
  totalItems: number;
  noOptionsLabel?: React.ReactNode;
  defaultCertificateVisibleFromDate?: string;
  progressTrackingEnabled: boolean;
}) {
  const columns = React.useMemo(
    () => [
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
            />
          </CheckboxField>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("certificate.handle", {
        id: "diploma",
        header: "Diploma",
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? <Code>{getValue()}</Code> : null;
        },
        enableSorting: false,
      }),
      columnHelper.accessor(
        (data) =>
          [
            data.person.firstName,
            data.person.lastNamePrefix,
            data.person.lastName,
          ]
            .filter(Boolean)
            .join(" "),
        {
          id: "cursist",
          header: "Naam",
          cell: ({ getValue }) => (
            <span className="font-medium text-zinc-950">{getValue()}</span>
          ),
        },
      ),
      columnHelper.accessor(
        (row) =>
          row.person.dateOfBirth
            ? dayjs().diff(dayjs(row.person.dateOfBirth), "year")
            : null,
        {
          id: "leeftijd",
          header: "Leeftijd",
          cell: ({ getValue }) => {
            const age = getValue();
            return age ? `${age} jr.` : null;
          },
          sortingFn: "alphanumeric",
        },
      ),
      columnHelper.accessor(
        (row) => {
          if (!row.studentCurriculum) return undefined;

          const coreModulesCompleted =
            row.studentCurriculum.moduleStatus.filter(
              ({
                module: { type },
                completedCompetencies,
                totalCompetencies,
              }) =>
                type === "required" &&
                completedCompetencies === totalCompetencies,
            ).length;

          return coreModulesCompleted;
        },
        {
          id: "kernmodules",
          header: "Kernmodules",
          sortUndefined: "last",
          cell: ({ row }) => {
            if (!row.original.studentCurriculum) {
              return null;
            }

            const coreModules =
              row.original.studentCurriculum.moduleStatus.filter(
                (status) => status.module.type === "required",
              );

            return (
              <div className="flex items-center gap-x-1.5">
                <span className="font-medium text-zinc-950">
                  {
                    coreModules.filter(
                      (status) =>
                        status.completedCompetencies ===
                        status.totalCompetencies,
                    ).length
                  }
                </span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-950">{coreModules.length}</span>
              </div>
            );
          },
        },
      ),
      columnHelper.accessor(
        (row) => {
          if (!row.studentCurriculum) return undefined;

          const electiveModulesCompleted =
            row.studentCurriculum.moduleStatus.filter(
              ({
                module: { type },
                completedCompetencies,
                totalCompetencies,
              }) =>
                type === "optional" &&
                completedCompetencies === totalCompetencies,
            ).length;

          return electiveModulesCompleted;
        },
        {
          id: "keuzemodules",
          header: "Keuzemodules",
          sortUndefined: "last",
          cell: ({ row }) => {
            if (!row.original.studentCurriculum) {
              return null;
            }

            const electiveModules =
              row.original.studentCurriculum.moduleStatus.filter(
                (status) => status.module.type === "optional",
              );

            return (
              <div className="flex items-center gap-x-1.5">
                <span className="font-medium text-zinc-950">
                  {
                    electiveModules.filter(
                      (status) =>
                        status.completedCompetencies ===
                        status.totalCompetencies,
                    ).length
                  }
                </span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-950">{electiveModules.length}</span>
              </div>
            );
          },
        },
      ),
      columnHelper.accessor(
        (data) =>
          data.studentCurriculum?.program.title ??
          data.studentCurriculum?.course.title,
        {
          id: "cursus",
          header: "Cursus",
        },
      ),
      columnHelper.accessor("studentCurriculum.degree.title", {
        id: "niveau",
        header: "Niveau",
      }),
      columnHelper.accessor("studentCurriculum.gearType.title", {
        id: "vaartuig",
        header: "Vaartuig",
      }),
      columnHelper.accessor(
        (data) =>
          data.instructor
            ? [
                data.instructor.firstName,
                data.instructor.lastNamePrefix,
                data.instructor.lastName,
              ]
                .filter(Boolean)
                .join(" ")
            : null,
        {
          id: "instructeur",
          header: "Instructeur",
          cell: ({ getValue }) => (
            <span className="font-medium text-zinc-950">{getValue()}</span>
          ),
        },
      ),
      columnHelper.accessor("tags", {
        id: "tags",
        header: "Tags",
        cell: ({ getValue }) => {
          return (
            <div className="flex gap-x-2 items-center">
              {getValue().map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("certificate.issuedAt", {
        id: "uitgegevenOp",
        header: "Diploma uitgegeven op",
        cell: ({ getValue }) => {
          const issuedAt = getValue();
          return issuedAt
            ? dayjs(issuedAt).tz().format("DD-MM-YYYY HH:mm")
            : null;
        },
      }),
      ...(progressTrackingEnabled
        ? [
            columnHelper.accessor("progressVisibleForStudentUpUntil", {
              id: "voortgang",
              header: "Voortgang zichtbaar tot",
              cell: ({ getValue }) => {
                const date = getValue();
                return date ? (
                  dayjs(date).tz().format("DD-MM-YYYY HH:mm")
                ) : (
                  <span className="text-gray-500">Niet zichtbaar</span>
                );
              },
            }),
          ]
        : []),
    ],
    [progressTrackingEnabled],
  );

  const [rowSelection, setRowSelection] = useQueryState<RowSelectionState>(
    "selectie",
    parseAsSelection.withDefault({}),
  );

  const [sort, setSort] = useQueryState(
    "sorteer",
    parseAsArrayOf(parseAsString).withDefault(["cursist.az"]),
  );

  const sortingState = useMemo(
    () =>
      generateSortingState(
        sort,
        columns.map((c) => c.id),
      ),
    // TODO: this feels a bit hacky, but we need a stable reference
    [sort.join(":")],
  );

  const onSortingChange = React.useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      void setSort((previousSort) => {
        const newSortValue =
          updater instanceof Function
            ? updater(
                generateSortingState(
                  previousSort,
                  columns.map((c) => c.id),
                ),
              )
            : updater;

        return newSortValue.map(
          (sort) => `${sort.id}.${sort.desc ? "za" : "az"}`,
        );
      });
    },
    [columns],
  );

  const table = useReactTable({
    data: students,
    columns,
    state: {
      rowSelection: transformSelectionState(rowSelection),
      sorting: sortingState,
    },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange,
  });

  const params = useParams();

  const selectedRows = Object.keys(rowSelection).length;
  const actionRows = Object.entries(rowSelection)
    .filter(([_, selected]) => selected)
    .map(([id]) => {
      const student =
        students.find((student) => student.id === id) ??
        selectedStudents.find((student) => student.id === id);

      return {
        id,
        certificate: student?.certificate ?? null,
        studentCurriculum: student?.studentCurriculum ?? null,
      };
    });

  return (
    <div className="mt-8 relative">
      <Table
        className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]"
        dense
      >
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortingHandler =
                  header.column.getToggleSortingHandler?.();
                const getAriaSortValue = (isSorted: false | SortDirection) => {
                  switch (isSorted) {
                    case "asc":
                      return "ascending";
                    case "desc":
                      return "descending";
                    case false:
                    default:
                      return "none";
                  }
                };

                return (
                  <TableHeader
                    key={header.id}
                    onClick={sortingHandler}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && sortingHandler) {
                        sortingHandler(event);
                      }
                    }}
                    className={clsx(
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : "",
                    )}
                    tabIndex={header.column.getCanSort() ? 0 : -1}
                    aria-sort={getAriaSortValue(header.column.getIsSorted())}
                  >
                    <div
                      className={clsx(
                        header.column.columnDef.enableSorting === false
                          ? header.column.columnDef.meta?.align
                          : "flex items-center justify-between gap-2 hover:bg-gray-50 hover:dark:bg-gray-900 px-3 py-1.5 -mx-3 -my-1.5",
                        "rounded-md",
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() &&
                        (header.column.getIsSorted() === false ? (
                          <ArrowsUpDownIcon className="size-3 text-gray-900 dark:text-gray-50 opacity-30" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowUpIcon
                            className="size-3 text-gray-900 dark:text-gray-50"
                            aria-hidden={true}
                          />
                        ) : (
                          <ArrowDownIcon
                            className="size-3 text-gray-900 dark:text-gray-50"
                            aria-hidden={true}
                          />
                        ))}
                    </div>
                  </TableHeader>
                );
              })}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowCount() <= 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                {noOptionsLabel}
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
              href={`/locatie/${params.location as string}/cohorten/${params.cohort as string}/${row.id}`}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={clsx(cell.column.columnDef.meta?.align)}
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
        <TableRowSelection table={table} totalItems={totalItems} />
        {/* <TablePagination totalItems={totalItems} /> */}
      </TableFooter>

      <div
        className={clsx(
          "fixed inset-x-0 bottom-14 mx-auto flex w-fit items-center space-x-2 rounded-lg border border-gray-200 bg-white p-2 shadow-md dark:border-gray-800 dark:bg-gray-950",
          selectedRows > 0 ? "" : "hidden",
        )}
      >
        <p className="select-none text-sm">
          <span className="rounded bg-branding-light/10 px-2 py-1.5 font-medium tabular-nums text-branding-dark">
            {selectedRows}
          </span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-50">
            geselecteerd
          </span>
        </p>
        <div className="flex items-center space-x-4">
          <Button plain onClick={() => void setRowSelection({})}>
            <XMarkIcon />
          </Button>
          <ActionButtons
            rows={actionRows}
            cohortId={cohortId}
            defaultVisibleFrom={defaultCertificateVisibleFromDate}
          />
        </div>
      </div>
    </div>
  );
}
