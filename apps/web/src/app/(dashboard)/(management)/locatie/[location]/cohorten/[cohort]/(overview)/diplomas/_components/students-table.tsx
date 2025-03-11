"use client";
import { XMarkIcon } from "@heroicons/react/16/solid";
import type { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useParams } from "next/navigation";
import React from "react";
import Search from "~/app/(dashboard)/(management)/_components/search";
import { Badge } from "~/app/(dashboard)/_components/badge";
import Breakout, {
  BreakoutCenter,
} from "~/app/(dashboard)/_components/breakout";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  TableFooter,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { SortableTableHead } from "~/app/(dashboard)/_components/table-head";
import {
  TableDisplay,
  TableOrderingContext,
} from "~/app/(dashboard)/_components/table-ordering";
import { Code } from "~/app/(dashboard)/_components/text";
import {
  getOrderableColumnIds,
  useColumnOrdering,
} from "~/app/(dashboard)/_hooks/use-column-ordering";
import {
  getSortableColumnIds,
  useSorting,
} from "~/app/(dashboard)/_hooks/use-sorting";
import dayjs from "~/lib/dayjs";
import type { listCertificateOverviewByCohortId } from "~/lib/nwd";
import { transformSelectionState } from "~/utils/table-state";
import { FilterSelect } from "./filter";
import { ActionButtons } from "./table-actions";
export type Student = Awaited<
  ReturnType<typeof listCertificateOverviewByCohortId>
>[number];
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
} from "~/app/(dashboard)/_components/table-content";

const columnHelper = createColumnHelper<Student>();

export default function StudentsTable({
  cohortId,
  students,
  totalItems,
  noOptionsLabel = "Geen items gevonden",
  defaultCertificateVisibleFromDate,
  progressTrackingEnabled,
}: {
  cohortId: string;
  students: Awaited<ReturnType<typeof listCertificateOverviewByCohortId>>;
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
          <CheckboxField className="relative">
            <span
              className="top-1/2 left-1/2 absolute size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
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
            <div className="flex items-center gap-x-2">
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
                  <span className="text-slate-500">Niet zichtbaar</span>
                );
              },
            }),
          ]
        : []),
    ],
    [progressTrackingEnabled],
  );

  const columnOrderingOptions = useColumnOrdering(
    getOrderableColumnIds({
      columns,
      excludeColumns: ["select"],
    }),
  );

  const sortingOptions = useSorting({
    sortableColumnIds: getSortableColumnIds(columns),
    defaultSorting: [{ id: "cursist", desc: false }],
  });

  const [rowSelection, setRowSelection] = React.useState<
    Record<
      string,
      {
        certificate: Student["certificate"];
        studentCurriculum: Student["studentCurriculum"];
      }
    >
  >({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const onRowSelectionChange = React.useCallback<OnChangeFn<RowSelectionState>>(
    (updater) => {
      setRowSelection((prev) => {
        const normalized = transformSelectionState(prev);

        const newSelectionValue =
          updater instanceof Function ? updater(normalized) : updater;

        // Generate new rowSelection object
        return Object.fromEntries(
          Object.keys(newSelectionValue).map((key) => {
            const student = students.find((student) => student.id === key);

            return [
              key,
              Object.hasOwn(rowSelection, key)
                ? // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  rowSelection[key]!
                : {
                    // biome-ignore lint/style/noNonNullAssertion: <explanation>
                    certificate: student!.certificate,
                    // biome-ignore lint/style/noNonNullAssertion: <explanation>
                    studentCurriculum: student!.studentCurriculum,
                  },
            ];
          }),
        );
      });
    },
    [students],
  );

  const table = useReactTable({
    ...columnOrderingOptions,
    ...sortingOptions,
    data: students,
    columns,
    initialState: {
      columnPinning: {
        left: ["select"],
      },
    },
    state: {
      rowSelection: transformSelectionState(rowSelection),
      ...columnOrderingOptions.state,
      ...sortingOptions.state,
    },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange,
  });

  const params = useParams();

  const selectedRows = Object.keys(rowSelection).length;
  const actionRows = Object.entries(rowSelection).map(([id, props]) => ({
    id,
    ...props,
  }));

  return (
    <div className="relative mt-8">
      <TableOrderingContext options={columnOrderingOptions}>
        <div className="flex sm:flex-row flex-col sm:justify-between items-start sm:items-center gap-1">
          <div className="w-full max-w-xl">
            <Search placeholder="Zoek cursisten op naam, cursus, instructeur of tag" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <FilterSelect />
            <TableDisplay table={table} />
          </div>
        </div>
        <Breakout>
          <Table className="mt-4 max-lg:[--gutter:--spacing(6)]" dense>
            <BreakoutCenter>
              <SortableTableHead table={table} />
              <TableBody>
                <NoTableRows table={table}>{noOptionsLabel}</NoTableRows>
                <DefaultTableRows
                  table={table}
                  href={(row) =>
                    `/locatie/${params.location as string}/cohorten/${params.cohort as string}/${row.id}`
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
              </TableBody>
            </BreakoutCenter>
          </Table>
        </Breakout>
      </TableOrderingContext>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        {/* <TablePagination totalItems={totalItems} /> */}
      </TableFooter>

      <div
        className={clsx(
          "bottom-14 fixed inset-x-0 flex items-center space-x-2 bg-white dark:bg-slate-950 shadow-md mx-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg w-fit",
          selectedRows > 0 ? "" : "hidden",
        )}
      >
        <p className="text-sm select-none">
          <span className="bg-branding-light/10 px-2 py-1.5 rounded-sm font-medium tabular-nums text-branding-dark">
            {selectedRows}
          </span>
          <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
            geselecteerd
          </span>
        </p>
        <div className="flex items-center space-x-4">
          <Button plain onClick={() => setRowSelection({})}>
            <XMarkIcon />
          </Button>
          <ActionButtons
            rows={actionRows}
            cohortId={cohortId}
            defaultVisibleFrom={defaultCertificateVisibleFromDate}
            resetSelection={() => setRowSelection({})}
          />
        </div>
      </div>
    </div>
  );
}
