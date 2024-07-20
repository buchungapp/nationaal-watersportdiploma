"use client";
import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
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
import dayjs from "~/lib/dayjs";
import { type listInstructorsByCohortId } from "~/lib/nwd";
import {
  addCohortRole,
  removeAllocation,
  removeCohortRole,
} from "../../_actions/nwd";

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
          cell: ({ getValue }) => (
            <span className="font-medium text-zinc-950">{getValue()}</span>
          ),
        },
      ),
      columnHelper.accessor("person.email", {
        header: "E-mail",
      }),
      columnHelper.accessor("roles", {
        header: "Rollen",
        cell: ({ getValue }) => (
          <div className="flex gap-x-2 items-center">
            {getValue().map((tag) => (
              <Badge key={tag.id}>{tag.title ?? tag.handle}</Badge>
            ))}
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
            await removeAllocation({
              locationId,
              allocationId: row.original.id,
              cohortId,
            });

            toast(`${row.original.person.firstName} verwijderd`);
          };

          const makeAdmin = async () => {
            await addCohortRole({
              roleHandle: "cohort_admin",
              allocationId: row.original.id,
              cohortId,
            });

            toast(`${row.original.person.firstName} is nu beheerder`);
          };

          const removeAdmin = async () => {
            await removeCohortRole({
              roleHandle: "cohort_admin",
              allocationId: row.original.id,
              cohortId,
            });

            toast(`${row.original.person.firstName} is geen beheerder meer`);
          };

          return (
            <>
              <div className="-mx-3 -my-1.5 sm:-mx-2.5">
                <Dropdown>
                  <DropdownButton plain aria-label="More options">
                    <EllipsisHorizontalIcon />
                  </DropdownButton>
                  <DropdownMenu anchor="bottom end">
                    <DropdownItem onClick={deleteInstructor}>
                      Verwijder uit cohort
                    </DropdownItem>
                    {row.original.roles.some(
                      (role) => role.handle === "cohort_admin",
                    ) ? (
                      <DropdownItem onClick={removeAdmin}>
                        Verwijder als beheerder
                      </DropdownItem>
                    ) : (
                      <DropdownItem onClick={makeAdmin}>
                        Maak beheerder
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
    <div className="mt-8 relative">
      <Table
        className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]"
        dense
      >
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
    </div>
  );
}
