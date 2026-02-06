"use client";

import {
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { useAction } from "next-safe-action/hooks";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getMergePreflightAction,
  getPersonByIdAction,
  mergePersonsAction,
} from "~/app/_actions/person/merge-persons-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import { usePersonSearch } from "~/app/(dashboard)/_hooks/swr/use-person-search";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Field, Fieldset, Label } from "~/app/(dashboard)/_components/fieldset";
import { Code } from "~/app/(dashboard)/_components/text";

import type { User } from "@nawadi/core";

type SearchPerson = Awaited<
  ReturnType<typeof User.Person.searchForAutocomplete>
>[number];

type PreflightData = NonNullable<
  Awaited<ReturnType<typeof getMergePreflightAction>>["data"]
>;

type PersonData = NonNullable<
  Awaited<ReturnType<typeof getPersonByIdAction>>["data"]
>;

// --- Combobox CSS (reused from the wrapper component) ---

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

// --- PersonSearchCombobox ---

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
          value={isTyping ? query : selectedPersonName ?? ""}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder="Typ om te zoeken…"
          autoComplete="off"
          spellCheck={false}
          className={inputClasses}
        />
        <Headless.ComboboxButton className="group right-0 absolute inset-y-0 flex items-center px-2" aria-label="Opties tonen">
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
          <div className="flex items-center gap-2 px-3.5 py-2 text-sm text-zinc-500" aria-live="polite">
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

// --- PersonPreviewCard ---

interface PersonPreviewCardProps {
  person: PreflightData["primary"]["person"] | null;
  stats: PreflightData["primary"]["stats"] | null;
  isLoading: boolean;
  variant: "primary" | "duplicate";
}

function PersonPreviewCard({
  person,
  stats,
  isLoading,
  variant,
}: PersonPreviewCardProps) {
  const fullName = person
    ? [person.firstName, person.lastNamePrefix, person.lastName]
        .filter(Boolean)
        .join(" ")
    : null;

  const formattedDate = person?.dateOfBirth
    ? new Intl.DateTimeFormat("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(person.dateOfBirth))
    : null;

  return (
    <div
      className={`rounded-lg border p-4 ${
        variant === "duplicate"
          ? "border-amber-200 bg-amber-50/50 dark:border-amber-700/50 dark:bg-amber-900/10"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${
            variant === "duplicate"
              ? "text-amber-700 dark:text-amber-400"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {variant === "primary" ? "Primair" : "Duplicaat"}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {variant === "primary" ? "(blijft behouden)" : "(wordt verwijderd)"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-5 w-5" />
        </div>
      ) : person ? (
        <div className="space-y-3">
          <div>
            <div className="font-medium text-zinc-900 dark:text-white">
              {fullName}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {person.email ?? "Geen e-mail"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">
                Geboortedatum:
              </span>
              <div className="tabular-nums text-zinc-700 dark:text-zinc-300">
                {formattedDate ?? "Onbekend"}
              </div>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">
                NWD-handle:
              </span>
              <div>
                <Code>{person.handle}</Code>
              </div>
            </div>
          </div>

          {person.birthCity && (
            <div className="text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                Geboorteplaats:
              </span>
              <div className="text-zinc-700 dark:text-zinc-300">
                {person.birthCity}
                {person.birthCountry?.name
                  ? `, ${person.birthCountry.name}`
                  : ""}
              </div>
            </div>
          )}

          <div className="text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Account:</span>
            <div className="flex items-center gap-1">
              {person.userId ? (
                <>
                  <span
                    aria-hidden="true"
                    className={
                      variant === "duplicate"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400"
                    }
                  >
                    {variant === "duplicate" ? "⚠" : "✓"}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    Gekoppeld account
                  </span>
                </>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">
                  Geen account
                </span>
              )}
            </div>
          </div>

          {stats && (
            <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {variant === "duplicate"
                  ? "Gegevens die worden overgedragen:"
                  : "Huidige gegevens:"}
              </div>
              <div className="grid grid-cols-2 gap-1 text-sm tabular-nums">
                <span className="text-zinc-600 dark:text-zinc-400">
                  • {stats.actorCount} rollen
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  • {stats.locationCount} locatie
                  {stats.locationCount !== 1 ? "s" : ""}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  • {stats.certificateCount} certificaten
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  • {stats.logbookCount} logboek items
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  • {stats.roleCount} systeemrollen
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  • {stats.kwalificatieCount} kwalificaties
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Selecteer een persoon
        </div>
      )}
    </div>
  );
}

// --- MergePersonsDialog ---

export default function MergePersonsDialog() {
  // URL state as single source of truth
  const [isOpen, setIsOpen] = useQueryState(
    "merge",
    parseAsBoolean.withDefault(false).withOptions({ shallow: false }),
  );
  const [primaryId, setPrimaryId] = useQueryState(
    "primaryId",
    parseAsString.withOptions({ shallow: false }),
  );
  const [duplicateId, setDuplicateId] = useQueryState(
    "duplicateId",
    parseAsString.withOptions({ shallow: false }),
  );

  // Individual person data (fetched independently when a single ID is set)
  const [primaryPersonData, setPrimaryPersonData] = useState<PersonData | null>(
    null,
  );
  const [duplicatePersonData, setDuplicatePersonData] =
    useState<PersonData | null>(null);

  // Search query state (ephemeral, not in URL)
  const [primaryQuery, setPrimaryQuery] = useState("");
  const [duplicateQuery, setDuplicateQuery] = useState("");

  // SWR-based person search with built-in debounce
  const {
    data: primaryResults,
    debouncedQuery: debouncedPrimaryQuery,
    isLoading: isPrimarySearching,
  } = usePersonSearch(primaryQuery, { excludePersonId: duplicateId });

  const {
    data: duplicateResults,
    debouncedQuery: debouncedDuplicateQuery,
    isLoading: isDuplicateSearching,
  } = usePersonSearch(duplicateQuery, { excludePersonId: primaryId });

  // Preflight action - fetched when both IDs are set
  const {
    execute: fetchPreflight,
    result: preflight,
    status: preflightStatus,
    reset: resetPreflight,
  } = useAction(getMergePreflightAction);

  // Merge action
  const { execute: executeMerge, status: mergeStatus } = useAction(
    mergePersonsAction,
    {
      onSuccess: () => {
        toast.success("Personen succesvol samengevoegd");
        handleClose();
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  // Fetch individual person data when an ID is set
  useEffect(() => {
    if (primaryId) {
      getPersonByIdAction({ personId: primaryId }).then((result) => {
        if (result?.data) {
          setPrimaryPersonData(result.data);
        }
      });
    } else {
      setPrimaryPersonData(null);
    }
  }, [primaryId]);

  useEffect(() => {
    if (duplicateId) {
      getPersonByIdAction({ personId: duplicateId }).then((result) => {
        if (result?.data) {
          setDuplicatePersonData(result.data);
        }
      });
    } else {
      setDuplicatePersonData(null);
    }
  }, [duplicateId]);

  // Fetch preflight when both IDs are present
  useEffect(() => {
    if (primaryId && duplicateId) {
      fetchPreflight({
        primaryPersonId: primaryId,
        duplicatePersonId: duplicateId,
      });
    } else {
      resetPreflight();
    }
  }, [primaryId, duplicateId, fetchPreflight, resetPreflight]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPrimaryId(null);
    setDuplicateId(null);
    setPrimaryPersonData(null);
    setDuplicatePersonData(null);
    setPrimaryQuery("");
    setDuplicateQuery("");
  }, [setIsOpen, setPrimaryId, setDuplicateId]);

  const handleSwap = useCallback(() => {
    const oldPrimary = primaryId;
    const oldDuplicate = duplicateId;
    setPrimaryId(oldDuplicate);
    setDuplicateId(oldPrimary);
    setPrimaryPersonData(duplicatePersonData);
    setDuplicatePersonData(primaryPersonData);
    setPrimaryQuery("");
    setDuplicateQuery("");
  }, [primaryId, duplicateId, setPrimaryId, setDuplicateId, primaryPersonData, duplicatePersonData]);

  const handleMerge = useCallback(() => {
    if (primaryId && duplicateId) {
      executeMerge({
        primaryPersonId: primaryId,
        duplicatePersonId: duplicateId,
      });
    }
  }, [primaryId, duplicateId, executeMerge]);

  // Prefer preflight data (has stats), fall back to individual fetch data
  const primaryPerson =
    preflight?.data?.primary.person ?? primaryPersonData ?? null;
  const duplicatePerson =
    preflight?.data?.duplicate.person ?? duplicatePersonData ?? null;

  // Derive display names
  const primaryPersonName = primaryPerson
    ? [
        primaryPerson.firstName,
        primaryPerson.lastNamePrefix,
        primaryPerson.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  const duplicatePersonName = duplicatePerson
    ? [
        duplicatePerson.firstName,
        duplicatePerson.lastNamePrefix,
        duplicatePerson.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  const isMerging = mergeStatus === "executing";

  const canSubmit =
    primaryId &&
    duplicateId &&
    primaryId !== duplicateId &&
    preflightStatus !== "executing" &&
    !isMerging;

  return (
    <Dialog open={isOpen} onClose={handleClose} size="4xl">
      <DialogTitle>Personen samenvoegen</DialogTitle>
      <DialogDescription>
        Selecteer twee personen om samen te voegen. Alle gegevens van het
        duplicaat worden overgedragen naar de primaire persoon.
      </DialogDescription>

      <DialogBody>
        {/* Swap button */}
        {primaryId && duplicateId && (
          <div className="mb-4 flex justify-center">
            <Button
              plain
              onClick={handleSwap}
              aria-label="Wissel primair en duplicaat"
            >
              <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden="true" />
              Wisselen
            </Button>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Primary person column */}
          <div className="space-y-4">
            <Fieldset>
              <Field>
                <Label>Primaire persoon</Label>
                <PersonSearchCombobox
                  selectedPersonName={primaryPersonName}
                  onSelect={(person) => setPrimaryId(person.id)}
                  label="Zoek primaire persoon"
                  isSearching={isPrimarySearching}
                  results={primaryResults}
                  query={primaryQuery}
                  debouncedQuery={debouncedPrimaryQuery}
                  onQueryChange={setPrimaryQuery}
                />
              </Field>
            </Fieldset>

            <PersonPreviewCard
              person={primaryPerson}
              stats={preflight?.data?.primary.stats ?? null}
              isLoading={!!primaryId && !primaryPerson}
              variant="primary"
            />
          </div>

          {/* Duplicate person column */}
          <div className="space-y-4">
            <Fieldset>
              <Field>
                <Label>Duplicaat persoon</Label>
                <PersonSearchCombobox
                  selectedPersonName={duplicatePersonName}
                  onSelect={(person) => setDuplicateId(person.id)}
                  label="Zoek duplicaat persoon"
                  isSearching={isDuplicateSearching}
                  results={duplicateResults}
                  query={duplicateQuery}
                  debouncedQuery={debouncedDuplicateQuery}
                  onQueryChange={setDuplicateQuery}
                />
              </Field>
            </Fieldset>

            <PersonPreviewCard
              person={duplicatePerson}
              stats={preflight?.data?.duplicate.stats ?? null}
              isLoading={!!duplicateId && !duplicatePerson}
              variant="duplicate"
            />
          </div>
        </div>

        {/* Warnings section */}
        {preflight?.data?.warnings && preflight.data.warnings.length > 0 && (
          <div className="mt-6 space-y-3">
            {preflight.data.warnings.map((warning) => (
              <div
                key={warning.type}
                className="rounded-lg bg-amber-50 p-4 text-sm dark:bg-amber-900/20"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon
                    className="h-5 w-5 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <p className="text-amber-800 dark:text-amber-200">
                    {warning.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Same person warning */}
        {primaryId && duplicateId && primaryId === duplicateId && (
          <div className="mt-6">
            <div
              className="rounded-lg bg-red-50 p-4 text-sm dark:bg-red-900/20"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon
                  className="h-5 w-5 shrink-0 text-red-600"
                  aria-hidden="true"
                />
                <p className="text-red-800 dark:text-red-200">
                  Je kunt een persoon niet met zichzelf samenvoegen.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogBody>

      <DialogActions>
        <Button plain onClick={handleClose}>
          Annuleren
        </Button>
        <Button
          color="branding-dark"
          disabled={!canSubmit}
          onClick={handleMerge}
        >
          {isMerging ? (
            <>
              <Spinner className="h-4 w-4" aria-hidden="true" />
              Samenvoegen…
            </>
          ) : (
            "Samenvoegen"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
