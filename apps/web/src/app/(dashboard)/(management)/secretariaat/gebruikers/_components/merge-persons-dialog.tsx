"use client";

import {
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
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
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Field, Fieldset, Label } from "~/app/(dashboard)/_components/fieldset";
import { PersonSearchCombobox } from "~/app/(dashboard)/_components/person-search-combobox";
import { Code } from "~/app/(dashboard)/_components/text";
import { usePersonSearch } from "~/app/(dashboard)/_hooks/swr/use-person-search";

type PreflightData = NonNullable<
  Awaited<ReturnType<typeof getMergePreflightAction>>["data"]
>;

type PersonData = NonNullable<
  Awaited<ReturnType<typeof getPersonByIdAction>>["data"]
>;

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
  }, [
    primaryId,
    duplicateId,
    setPrimaryId,
    setDuplicateId,
    primaryPersonData,
    duplicatePersonData,
  ]);

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
