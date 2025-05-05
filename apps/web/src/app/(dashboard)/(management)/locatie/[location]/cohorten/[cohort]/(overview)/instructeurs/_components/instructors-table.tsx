"use client";
import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { addRoleToInstructorInCohortAction } from "~/actions/cohort/instructor/add-role-to-instructor-in-cohort-action";
import { removeRoleFromInstructorInCohortAction } from "~/actions/cohort/instructor/remove-role-from-instructor-in-cohort-action";
import { removeInstructorFromCohortAction } from "~/actions/cohort/remove-instructor-from-cohort-action";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
} from "~/app/(dashboard)/_components/table-content";
import {
  TableFooter,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
import { TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import type { listInstructorsByCohortId } from "~/lib/nwd";

export type Instructor = Awaited<
  ReturnType<typeof listInstructorsByCohortId>
>[number];

const columnHelper = createColumnHelper<Instructor>();

export default function InstructorsTable({
  cohortId,
  instructors,
  totalItems,
  locationId,
}: {
  cohortId: string;
  instructors: Awaited<ReturnType<typeof listInstructorsByCohortId>>;
  totalItems: number;
  locationId: string;
}) {
  const params = useParams();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const columns = useMemo(
    () => [
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
          header: "Naam",
          cell: ({ getValue, row }) => (
            <TextLink
              href={`/locatie/${params.location as string}/personen/${row.original.person.id}`}
              className="font-medium"
            >
              {getValue()}
            </TextLink>
          ),
        },
      ),
      columnHelper.accessor("person.email", {
        header: "E-mail",
      }),
      columnHelper.accessor("roles", {
        header: "Rollen",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-x-2">
            {getValue().map((tag) => (
              <Badge key={tag.id}>{tag.title ?? tag.handle}</Badge>
            ))}
            <Badge>Instructeur</Badge>
          </div>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Toegevoegd",
        cell: ({ getValue }) => {
          const createdAt = getValue();
          return dayjs(createdAt).format("DD-MM-YYYY");
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const deleteInstructor = async () => {
            await removeInstructorFromCohortAction(
              locationId,
              cohortId,
              row.original.id,
            );

            toast(`${row.original.person.firstName} verwijderd`);
          };

          const makeAdmin = async () => {
            await addRoleToInstructorInCohortAction(
              cohortId,
              row.original.id,
              "cohort_admin",
            );

            toast(`${row.original.person.firstName} is nu beheerder`);
          };

          const removeAdmin = async () => {
            await removeRoleFromInstructorInCohortAction(
              cohortId,
              row.original.id,
              "cohort_admin",
            );

            toast(`${row.original.person.firstName} is geen beheerder meer`);
          };

          return (
            <>
              <div className="-mx-3 sm:-mx-2.5 -my-1.5">
                <Dropdown>
                  <DropdownButton outline aria-label="Meer opties">
                    <EllipsisHorizontalIcon />
                  </DropdownButton>
                  <DropdownMenu anchor="bottom end">
                    <DropdownItem onClick={deleteInstructor}>
                      <DropdownLabel>Verwijder uit cohort</DropdownLabel>
                    </DropdownItem>
                    {row.original.roles.some(
                      (role) => role.handle === "cohort_admin",
                    ) ? (
                      <DropdownItem onClick={removeAdmin}>
                        <DropdownLabel>Verwijder als beheerder</DropdownLabel>
                      </DropdownItem>
                    ) : (
                      <DropdownItem onClick={makeAdmin}>
                        <DropdownLabel>Maak beheerder</DropdownLabel>
                      </DropdownItem>
                    )}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </>
          );
        },
      }),
    ],
    [locationId],
  );

  const table = useReactTable({
    data: instructors,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative mt-8">
      <Table
        className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
        dense
      >
        <DefaultTableHead table={table} />
        <TableBody>
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
        </TableBody>
      </Table>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        {/* <TablePagination totalItems={totalItems} /> */}
      </TableFooter>
    </div>
  );
}
