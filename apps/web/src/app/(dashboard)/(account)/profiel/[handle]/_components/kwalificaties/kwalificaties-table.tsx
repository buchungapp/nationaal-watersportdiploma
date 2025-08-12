"use client";
import type { KSS } from "@nawadi/core";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { KwalificatieBadge } from "~/app/(dashboard)/(management)/locatie/[location]/instructeurskwalificaties/_components/kwalificatie-badge";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  DefaultTableCell,
  DefaultTableRows,
  PlaceholderTableRows,
} from "~/app/(dashboard)/_components/table-content";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
import type { listCourses } from "~/lib/nwd";

type Course = Awaited<ReturnType<typeof listCourses>>[number];
type Kwalificatie = Awaited<
  ReturnType<
    typeof KSS.Kwalificaties.listHighestKwalificatiePerCourseAndRichting
  >
>[number];
const SORT_ORDER: Kwalificatie["richting"][] = [
  "pvb_beoordelaar",
  "leercoach",
  "instructeur",
];

const columnHelper = createColumnHelper<Kwalificatie[]>();

export function KwalificatiesTable({
  kwalificaties,
  courses,
  placeholderRows,
}: {
  kwalificaties: Kwalificatie[];
  courses: Course[];
  placeholderRows?: number;
}) {
  const columns = useMemo(
    () => [
      ...courses.map((course) =>
        columnHelper.display({
          id: course.id,
          header: course.abbreviation ?? course.title ?? course.handle,
          cell: ({ row }) => {
            const kwalificaties = row.original
              .filter((k) => k.courseId === course.id)
              .toSorted(
                (a, b) =>
                  SORT_ORDER.indexOf(a.richting) -
                  SORT_ORDER.indexOf(b.richting),
              );

            return (
              <div className="flex flex-col justify-center items-center gap-1">
                {kwalificaties.map((k) => (
                  <KwalificatieBadge
                    key={k.courseId + k.richting}
                    richting={k.richting}
                    niveau={k.hoogsteNiveau}
                  />
                ))}
              </div>
            );
          },
        }),
      ),
    ],
    [courses],
  );

  const table = useReactTable({
    data: [kwalificaties],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Table
        className="mt-4 [--gutter:--spacing(3)] lg:[--gutter:--spacing(5)]"
        dense
      >
        <DefaultTableHead table={table} />
        <TableBody>
          <PlaceholderTableRows table={table} rows={placeholderRows}>
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
    </>
  );
}
