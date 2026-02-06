"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import type { User } from "@nawadi/core";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { updatePersonEmailForAdminAction } from "~/app/_actions/person/merge-persons-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Input } from "~/app/(dashboard)/_components/input";
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
import { Code } from "~/app/(dashboard)/_components/text";

type Person = Awaited<ReturnType<typeof User.Person.list>>["items"][number];

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor("handle", {
    header: "NWD-id",
    cell: ({ getValue }) => <Code>{getValue()}</Code>,
  }),
  columnHelper.accessor(
    (data) =>
      [data.firstName, data.lastNamePrefix, data.lastName]
        .filter(Boolean)
        .join(" "),
    {
      id: "name",
      header: "Naam",
      cell: ({ getValue }) => (
        <div className="min-w-0">
          <span className="truncate font-medium text-zinc-900 dark:text-white">
            {getValue()}
          </span>
        </div>
      ),
    },
  ),
  columnHelper.accessor("email", {
    header: "E-mailadres",
    cell: ({ getValue }) => (
      <div className="min-w-0">
        <span className="truncate text-zinc-600 dark:text-zinc-400">
          {getValue() ?? "Geen e-mail"}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("dateOfBirth", {
    header: "Geboortedatum",
    cell: ({ getValue }) => {
      const dateOfBirth = getValue();
      if (!dateOfBirth) return null;

      const formatted = new Intl.DateTimeFormat("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(dateOfBirth));

      return <span className="tabular-nums">{formatted}</span>;
    },
  }),
  columnHelper.accessor("userId", {
    header: "Account",
    cell: ({ getValue }) =>
      getValue() ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Gekoppeld
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          Geen account
        </span>
      ),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <RowActions person={row.original} />,
  }),
];

function RowActions({ person }: { person: Person }) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const { execute, result, reset } = useAction(
    updatePersonEmailForAdminAction,
    {
      onSuccess: () => {
        toast.success("E-mailadres bijgewerkt.");
        closeEmailDialog();
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const closeEmailDialog = () => {
    setIsEmailDialogOpen(false);
    reset();
  };

  return (
    <div className="flex justify-end">
      <Dropdown>
        <DropdownButton plain aria-label="Acties">
          <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          <DropdownItem onClick={() => setIsEmailDialogOpen(true)}>
            E-mail wijzigen…
          </DropdownItem>
          <DropdownItem href={`?merge=true&duplicateId=${person.id}`}>
            Samenvoegen…
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Alert open={isEmailDialogOpen} onClose={closeEmailDialog} size="md">
        <form
          action={(formData) => {
            const email = formData.get("email") as string;
            execute({ personId: person.id, email });
          }}
        >
          <AlertTitle>E-mailadres wijzigen</AlertTitle>
          <AlertDescription>
            Voer het nieuwe e-mailadres in. Dit verplaatst de persoon naar het
            account met dit e-mailadres.
          </AlertDescription>
          <AlertBody>
            <Input
              name="email"
              type="email"
              aria-label="E-mail"
              autoComplete="off"
              spellCheck={false}
              placeholder="nieuw@voorbeeld.nl"
              invalid={!!result.validationErrors?.email}
              defaultValue={person.email ?? ""}
            />
          </AlertBody>
          <AlertActions>
            <Button plain onClick={closeEmailDialog}>
              Annuleren
            </Button>
            <Button type="submit" color="branding-dark">
              Bevestigen
            </Button>
          </AlertActions>
        </form>
      </Alert>
    </div>
  );
}

export default function GebruikersTable({
  persons,
  totalItems,
  placeholderRows,
}: {
  persons: Person[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const table = useReactTable({
    data: persons,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <Table
        className="mt-8 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
        dense
      >
        <DefaultTableHead table={table} />
        <TableBody>
          <PlaceholderTableRows table={table} rows={placeholderRows}>
            <NoTableRows table={table}>Geen personen gevonden</NoTableRows>
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

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} />
      </TableFooter>
    </>
  );
}
