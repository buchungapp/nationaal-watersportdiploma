"use client";
import type { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useParams } from "next/navigation";
import React, { Suspense, use, useMemo } from "react";
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
} from "~/app/(dashboard)/_components/table-content";
import {
  TableFooter,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { SortableTableHead } from "~/app/(dashboard)/_components/table-head";
import {
  TableDisplay,
  TableOrderingContext,
} from "~/app/(dashboard)/_components/table-ordering";
import {
  getOrderableColumnIds,
  useColumnOrdering,
} from "~/app/(dashboard)/_hooks/use-column-ordering";
import {
  getSortableColumnIds,
  useSorting,
} from "~/app/(dashboard)/_hooks/use-sorting";
import Search from "~/app/(dashboard)/(management)/_components/search";
import dayjs from "~/lib/dayjs";
import type { listStudentsWithCurriculaByCohortId } from "~/lib/nwd";
import { transformSelectionState } from "~/utils/table-state";
import type { StudentsProgressData } from "../_student-progress";
import { ExportStudentsListDialog } from "./download/export-students-list-dialog";
import { SetView } from "./filters";
import { ActionButtons } from "./table-actions";

export type Student = Awaited<
  ReturnType<typeof listStudentsWithCurriculaByCohortId>
>[number];

const columnHelper = createColumnHelper<Student>();

const ProgramProgress = ({
  studentProgress: studentProgressPromise,
  personId,
}: {
  studentProgress: Promise<StudentsProgressData>;
  personId: string;
}) => {
  const data = use(studentProgressPromise);

  const studentProgress = data.find(
    (student) => student.personId === personId,
  )?.curricula;

  if (!studentProgress || studentProgress.length === 0) {
    return <div className="text-zinc-500 text-sm">Geen diploma's</div>;
  }

  // Group curricula by discipline and find highest ranked degree per discipline
  const highestDegreesByCourse = studentProgress.reduce(
    (acc, curriculum) => {
      const key = `${curriculum.curriculum.curriculum.program.course.id}`;
      const currentRank = curriculum.curriculum.curriculum.program.degree.rang;

      if (
        !acc[key] ||
        currentRank > acc[key].curriculum.curriculum.program.degree.rang
      ) {
        acc[key] = curriculum;
      }

      return acc;
    },
    {} as Record<string, (typeof studentProgress)[0]>,
  );

  return (
    <div className="flex flex-col gap-1">
      {Object.values(highestDegreesByCourse)
        .sort((a, b) => {
          return (
            a.curriculum.curriculum.program.course.discipline.weight -
            b.curriculum.curriculum.program.course.discipline.weight
          );
        })
        .map((curriculum) => (
          <div
            key={curriculum.curriculum.curriculum.program.course.id}
            className="flex items-center gap-1.5"
          >
            <span className="text-sm">
              {curriculum.curriculum.curriculum.program.course.title}
            </span>
            <span className="font-medium text-sm">
              {curriculum.curriculum.curriculum.program.degree.title}
            </span>
            <span className="text-zinc-500 text-xs">
              ({curriculum.progress?.modules.length ?? 0}/
              {curriculum.curriculum.curriculum.modules.length})
            </span>
          </div>
        ))}
    </div>
  );
};

const columns = ({
  studentsProgressPromise,
}: {
  studentsProgressPromise: Promise<StudentsProgressData>;
}) => [
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
          className="-translate-y-[1px]"
        />
      </CheckboxField>
    ),
    header: ({ table }) => {
      return (
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
      );
    },
    enableSorting: false,
  }),
  columnHelper.accessor(
    (data) =>
      [data.person.firstName, data.person.lastNamePrefix, data.person.lastName]
        .filter(Boolean)
        .join(" "),
    {
      id: "cursist",
      header: "Naam",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
      ),
      sortingFn: "text",
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
  columnHelper.accessor((data) => data.studentCurriculum?.course.title, {
    id: "cursus",
    header: "Cursus",
    sortUndefined: "last",
    sortingFn: "text",
  }),
  columnHelper.accessor("studentCurriculum.degree.title", {
    id: "niveau",
    header: "Niveau",
    sortUndefined: "last",
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("studentCurriculum.gearType.title", {
    id: "vaartuig",
    header: "Vaartuig",
    sortUndefined: "last",
    sortingFn: "text",
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
        : undefined,
    {
      id: "instructeur",
      header: "Instructeur",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
      ),
      sortUndefined: "last",
      sortingFn: "text",
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
  columnHelper.display({
    id: "program-progress",
    cell: ({ row }) => (
      <Suspense fallback={<div>Loading...</div>}>
        <ProgramProgress
          studentProgress={studentsProgressPromise}
          personId={row.original.person.id}
        />
      </Suspense>
    ),
    header: "Hoogste niveau per cursus",
    enableSorting: false,
    // @ts-expect-error - isDefaultVisible is not typed
    isDefaultVisible: false,
  }),
];

export default function StudentsTable({
  cohortId,
  locationId,
  cohortLabel,
  students,
  totalItems,
  noOptionsLabel = "Geen items gevonden",
  locationRoles,
  view,
  studentsProgressPromise,
}: {
  cohortId: string;
  locationId: string;
  cohortLabel: string;
  students: Awaited<ReturnType<typeof listStudentsWithCurriculaByCohortId>>;
  totalItems: number;
  noOptionsLabel?: React.ReactNode;
  locationRoles: ("student" | "instructor" | "location_admin")[];
  view: "allen" | "geclaimd" | null;
  studentsProgressPromise: Promise<StudentsProgressData>;
}) {
  const generatedColumns = useMemo(() => {
    return columns({ studentsProgressPromise });
  }, [studentsProgressPromise]);

  const columnOrderingOptions = useColumnOrdering(
    getOrderableColumnIds({
      columns: generatedColumns,
      excludeColumns: ["select"],
    }),
  );

  const sortingOptions = useSorting({
    sortableColumnIds: getSortableColumnIds(generatedColumns),
    defaultSorting: [{ id: "cursist", desc: false }],
  });

  const [rowSelection, setRowSelection] = React.useState<
    Record<
      string,
      {
        instructor: Student["instructor"];
        studentCurriculum: Student["studentCurriculum"];
        person: Student["person"];
        tags: Student["tags"];
      }
    >
  >({});

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
              Object.hasOwn(prev, key)
                ? // biome-ignore lint/style/noNonNullAssertion: intentional
                  prev[key]!
                : {
                    // biome-ignore lint/style/noNonNullAssertion: intentional
                    instructor: student!.instructor,
                    // biome-ignore lint/style/noNonNullAssertion: intentional
                    studentCurriculum: student!.studentCurriculum,
                    // biome-ignore lint/style/noNonNullAssertion: intentional
                    person: student!.person,
                    // biome-ignore lint/style/noNonNullAssertion: intentional
                    tags: student!.tags,
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
    columns: generatedColumns,
    state: {
      rowSelection: transformSelectionState(rowSelection),
      ...columnOrderingOptions.state,
      ...sortingOptions.state,
    },
    initialState: {
      columnPinning: {
        left: ["select"],
      },
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
          <div className="flex items-center gap-1 sm:shrink-0">
            <ExportStudentsListDialog
              cohortId={cohortId}
              cohortLabel={cohortLabel}
            />
            {view ? (
              <SetView defaultView={view}>
                <option value="allen">Alle cursisten</option>
                <option value="geclaimd">Mijn cursisten</option>
              </SetView>
            ) : null}
            <TableDisplay table={table} />
          </div>
        </div>
        <Table
          className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
          dense
        >
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
        </Table>
      </TableOrderingContext>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
      </TableFooter>

      <TableSelection
        selectedRows={selectedRows}
        clearRowSelection={() => setRowSelection({})}
      >
        <ActionButtons
          rows={actionRows}
          cohortId={cohortId}
          locationId={locationId}
          locationRoles={locationRoles}
        />
      </TableSelection>
    </div>
  );
}
