"use client";

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
} from "~/app/(dashboard)/_components/table-content";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
import { Code, Text } from "~/app/(dashboard)/_components/text";
import type {
  listCourses,
  listPersonsAtLocationAsAdmin,
  listResourcesForLocation,
} from "~/lib/nwd";

type Admin = Awaited<ReturnType<typeof listPersonsAtLocationAsAdmin>>[number];
type Course = Awaited<ReturnType<typeof listCourses>>[number];
type GearType = Awaited<
  ReturnType<typeof listResourcesForLocation>
>["gearTypes"][number]["gearType"];

const columnHelper = createColumnHelper<Admin>();

const adminColumns = [
  columnHelper.accessor(
    (data) =>
      [data.firstName, data.lastNamePrefix, data.lastName]
        .filter(Boolean)
        .join(" "),
    {
      id: "name",
      header: "Naam",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-900 dark:text-white">
          {getValue()}
        </span>
      ),
    },
  ),
  columnHelper.accessor("handle", {
    header: "NWD-id",
    cell: ({ getValue }) => <Code>{getValue()}</Code>,
  }),
];

function ScrollBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="max-h-64 overflow-y-auto">{children}</div>
    </div>
  );
}

function AdminsTable({ admins }: { admins: Admin[] }) {
  const table = useReactTable({
    data: admins,
    columns: adminColumns as ColumnDef<Admin, string>[],
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <ScrollBox>
      <Table dense>
        <DefaultTableHead table={table} />
        <TableBody>
          <NoTableRows table={table}>Nog geen locatiebeheerders</NoTableRows>
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
        </TableBody>
      </Table>
    </ScrollBox>
  );
}

function ResourceList({
  items,
  emptyMessage,
}: {
  items: string[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <ScrollBox>
        <Text className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
          {emptyMessage}
        </Text>
      </ScrollBox>
    );
  }

  return (
    <ScrollBox>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {items.map((item) => (
          <li
            key={item}
            className="px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100"
          >
            {item}
          </li>
        ))}
      </ul>
    </ScrollBox>
  );
}

export function LocationOverviewSection({
  admins,
  courses,
  gearTypes,
}: {
  admins: Admin[];
  courses: Course[];
  gearTypes: GearType[];
}) {
  const courseTitles = courses
    .map((course) => course.title)
    .filter((title): title is string => title != null)
    .sort((a, b) => a.localeCompare(b, "nl"));

  const boatTitles = gearTypes
    .map((gearType) => gearType.title ?? gearType.handle)
    .sort((a, b) => a.localeCompare(b, "nl"));

  return (
    <div className="space-y-10">
      <section>
        <Heading level={2}>Locatiebeheerders ({admins.length})</Heading>
        <AdminsTable admins={admins} />
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <Heading level={2}>Cursussen ({courseTitles.length})</Heading>
          <Text className="mt-1 text-sm">
            Cursussen beschikbaar via geselecteerde disciplines.
          </Text>
          <ResourceList
            items={courseTitles}
            emptyMessage="Nog geen cursussen — selecteer disciplines in de instellingen"
          />
        </div>

        <div>
          <Heading level={2}>Vaartuigen ({boatTitles.length})</Heading>
          <Text className="mt-1 text-sm">
            Vaartuigen die deze locatie aanbiedt.
          </Text>
          <ResourceList
            items={boatTitles}
            emptyMessage="Nog geen vaartuigen — stel in via de instellingen"
          />
        </div>
      </section>
    </div>
  );
}
