"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { addLocationAdminAsSystemAdminAction } from "~/app/_actions/location/add-location-admin-action";
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
import { Field, Fieldset, Label } from "~/app/(dashboard)/_components/fieldset";
import {
  PersonSearchCombobox,
  type SearchPerson,
} from "~/app/(dashboard)/_components/person-search-combobox";
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
import { usePersonSearch } from "~/app/(dashboard)/_hooks/swr/use-person-search";
import type { listAllLocationsAsAdmin } from "~/lib/nwd";

type Location = Awaited<ReturnType<typeof listAllLocationsAsAdmin>>[number];

const columnHelper = createColumnHelper<Location>();

const columns = [
  columnHelper.accessor("name", {
    header: "Naam",
    cell: ({ getValue }) => (
      <div className="min-w-0">
        <span className="truncate font-medium text-zinc-900 dark:text-white">
          {getValue() ?? "-"}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("handle", {
    header: "Handle",
    cell: ({ getValue }) => <Code>{getValue()}</Code>,
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <RowActions location={row.original} />,
  }),
];

function RowActions({ location }: { location: Location }) {
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPersonName, setSelectedPersonName] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: searchResults,
    debouncedQuery,
    isLoading: isSearching,
  } = usePersonSearch(searchQuery);

  const { execute, reset } = useAction(addLocationAdminAsSystemAdminAction, {
    onSuccess: () => {
      toast.success("Locatiebeheerder toegevoegd.");
      closeAdminDialog();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  const closeAdminDialog = () => {
    setIsAdminDialogOpen(false);
    setSelectedPersonId(null);
    setSelectedPersonName(null);
    setSearchQuery("");
    reset();
  };

  const handleSelectPerson = (person: SearchPerson) => {
    setSelectedPersonId(person.id);
    const name = [person.firstName, person.lastNamePrefix, person.lastName]
      .filter(Boolean)
      .join(" ");
    setSelectedPersonName(name);
  };

  return (
    <div className="flex justify-end">
      <Dropdown>
        <DropdownButton plain aria-label="Acties">
          <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          <DropdownItem onClick={() => setIsAdminDialogOpen(true)}>
            Locatiebeheerder toevoegen…
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Alert open={isAdminDialogOpen} onClose={closeAdminDialog} size="md">
        <AlertTitle>Locatiebeheerder toevoegen</AlertTitle>
        <AlertDescription>
          Zoek en selecteer de persoon die je als locatiebeheerder wilt
          toevoegen voor {location.name}.
        </AlertDescription>
        <AlertBody>
          <Fieldset>
            <Field>
              <Label>Persoon</Label>
              <PersonSearchCombobox
                selectedPersonName={selectedPersonName}
                onSelect={handleSelectPerson}
                label="Zoek persoon"
                isSearching={isSearching}
                results={searchResults}
                query={searchQuery}
                debouncedQuery={debouncedQuery}
                onQueryChange={setSearchQuery}
              />
            </Field>
          </Fieldset>
        </AlertBody>
        <AlertActions>
          <Button plain onClick={closeAdminDialog}>
            Annuleren
          </Button>
          <Button
            color="branding-dark"
            disabled={!selectedPersonId}
            onClick={() => {
              if (selectedPersonId) {
                execute({
                  locationId: location.id,
                  personId: selectedPersonId,
                });
              }
            }}
          >
            Toevoegen
          </Button>
        </AlertActions>
      </Alert>
    </div>
  );
}

export default function LocatiesTable({
  locations,
  totalItems,
  placeholderRows,
}: {
  locations: Location[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const table = useReactTable({
    data: locations,
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
            <NoTableRows table={table}>Geen locaties gevonden</NoTableRows>
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
