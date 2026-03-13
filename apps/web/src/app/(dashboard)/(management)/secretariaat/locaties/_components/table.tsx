"use client";

import * as Headless from "@headlessui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import type { User } from "@nawadi/core";
import clsx from "clsx";
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
import Spinner from "~/app/_components/spinner";
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
type SearchPerson = Awaited<
  ReturnType<typeof User.Person.searchForAutocomplete>
>[number];

const controlClasses = clsx(
  "relative block w-full",
  "before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm",
  "dark:before:hidden",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset sm:focus-within:after:ring-2 sm:focus-within:after:ring-blue-500",
  "has-data-disabled:opacity-50 has-data-disabled:before:bg-zinc-950/5 has-data-disabled:before:shadow-none",
  "has-data-invalid:before:shadow-red-500/10",
);

const inputClasses = clsx(
  "relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]",
  "pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:pr-[calc(--spacing(9)-1px)] sm:pl-[calc(--spacing(3)-1px)]",
  "text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white",
  "border border-zinc-950/10 data-hover:border-zinc-950/20 dark:border-white/10 dark:data-hover:border-white/20",
  "bg-transparent dark:bg-white/5",
  "focus:outline-hidden",
  "data-invalid:border-red-500 data-invalid:data-hover:border-red-500 dark:data-invalid:border-red-500 dark:data-invalid:data-hover:border-red-500",
  "data-disabled:border-zinc-950/20 dark:data-disabled:border-white/15 dark:data-disabled:bg-white/[2.5%] dark:data-hover:data-disabled:border-white/15",
  "dark:scheme-dark",
);

const optionsClasses = clsx(
  "[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(4)] sm:data-[anchor~=start]:[--anchor-offset:-4px]",
  "isolate min-w-[calc(var(--input-width)+8px)] scroll-py-1 rounded-xl p-1 select-none empty:invisible",
  "outline outline-transparent focus:outline-hidden",
  "overflow-y-scroll overscroll-contain",
  "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",
  "shadow-lg ring-1 ring-zinc-950/10 dark:ring-white/10 dark:ring-inset",
  "transition-opacity duration-100 ease-in data-closed:data-leave:opacity-0 data-transition:pointer-events-none",
);

const optionClasses = clsx(
  "group/option grid w-full cursor-default grid-cols-[1fr_--spacing(5)] items-baseline gap-x-2 rounded-lg py-2.5 pr-2 pl-3.5 sm:grid-cols-[1fr_--spacing(4)] sm:py-1.5 sm:pr-2 sm:pl-3",
  "text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]",
  "outline-hidden data-focus:bg-blue-500 data-focus:text-white",
  "forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText]",
  "data-disabled:opacity-50",
);

function PersonSearchCombobox({
  selectedPersonName,
  onSelect,
  label,
  isSearching,
  results,
  query,
  debouncedQuery,
  onQueryChange,
}: {
  selectedPersonName: string | null;
  onSelect: (person: SearchPerson) => void;
  label: string;
  isSearching: boolean;
  results: SearchPerson[];
  query: string;
  debouncedQuery: string | null;
  onQueryChange: (query: string) => void;
}) {
  const isTyping = query.length > 0;

  return (
    <Headless.Combobox
      immediate
      onChange={(person: SearchPerson | null) => {
        if (person) {
          onSelect(person);
        }
        onQueryChange("");
      }}
      onClose={() => onQueryChange("")}
    >
      <span data-slot="control" className={controlClasses}>
        <Headless.ComboboxInput
          aria-label={label}
          data-slot="control"
          value={isTyping ? query : (selectedPersonName ?? "")}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder="Typ om te zoeken…"
          autoComplete="off"
          spellCheck={false}
          className={inputClasses}
        />
        <Headless.ComboboxButton
          className="group right-0 absolute inset-y-0 flex items-center px-2"
          aria-label="Opties tonen"
        >
          <svg
            className="stroke-zinc-500 dark:group-data-hover:stroke-zinc-300 dark:stroke-zinc-400 forced-colors:stroke-[CanvasText] group-data-disabled:stroke-zinc-600 group-data-hover:stroke-zinc-700 size-5 sm:size-4"
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M5.75 10.75L8 13L10.25 10.75"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.25 5.25L8 3L5.75 5.25"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Headless.ComboboxButton>
      </span>
      <Headless.ComboboxOptions
        transition
        anchor="bottom"
        className={optionsClasses}
      >
        {isSearching && (
          <div
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-zinc-500"
            aria-live="polite"
          >
            <Spinner className="h-3 w-3" aria-hidden="true" /> Zoeken…
          </div>
        )}
        {!isSearching && debouncedQuery && results.length === 0 && (
          <div className="px-3.5 py-2 text-sm text-zinc-500" aria-live="polite">
            Geen personen gevonden
          </div>
        )}
        {results.map((person) => {
          const name = [
            person.firstName,
            person.lastNamePrefix,
            person.lastName,
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <Headless.ComboboxOption
              key={person.id}
              value={person}
              className={optionClasses}
            >
              <span className="flex min-w-0 flex-col">
                <span className="ml-2.5 truncate first:ml-0 sm:ml-2 sm:first:ml-0">
                  {name}
                </span>
                <span className="flex flex-1 overflow-hidden text-zinc-500 group-data-focus/option:text-white before:w-2 before:min-w-0 before:shrink dark:text-zinc-400">
                  <span className="flex-1 truncate">
                    {person.email ?? "Geen e-mail"} · {person.handle}
                    {person.dateOfBirth &&
                      ` · Geb. ${new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(person.dateOfBirth))}`}
                  </span>
                </span>
              </span>
            </Headless.ComboboxOption>
          );
        })}
      </Headless.ComboboxOptions>
    </Headless.Combobox>
  );
}

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
                execute({ locationId: location.id, personId: selectedPersonId });
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
