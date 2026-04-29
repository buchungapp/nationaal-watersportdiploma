"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  getOperatorMergePreflightAction,
  mergeOperatorPersonsAction,
} from "~/app/_actions/person/merge-persons-operator-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Strong, Text } from "~/app/(dashboard)/_components/text";

// Operator-facing merge confirm dialog. Purpose-built for the
// duplicates-view + cohort-banner flows where the operator clicks a
// pre-computed pair (no search-and-pick needed). Loads preflight on open,
// shows stats + warnings, executes merge on confirm.
//
// Distinct from the secretariaat merge dialog (apps/web/src/app/(dashboard)/
// (management)/secretariaat/gebruikers/_components/merge-persons-dialog.tsx)
// which has a sysadmin search-and-pick UX. Sysadmin dialog stays untouched.

export function OperatorMergeConfirmDialog({
  open,
  onClose,
  onMerged,
  primaryPersonId,
  duplicatePersonId,
  locationId,
  source,
}: {
  open: boolean;
  onClose: () => void;
  onMerged?: () => void;
  primaryPersonId: string;
  duplicatePersonId: string;
  locationId: string;
  source: "personen_page" | "cohort_view";
}) {
  const preflight = useAction(getOperatorMergePreflightAction);
  const merge = useAction(mergeOperatorPersonsAction, {
    onSuccess: () => {
      toast.success("Profielen samengevoegd.");
      onMerged?.();
      onClose();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  useEffect(() => {
    if (open && primaryPersonId && duplicatePersonId) {
      preflight.execute({
        primaryPersonId,
        duplicatePersonId,
        locationId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, primaryPersonId, duplicatePersonId, locationId]);

  const data = preflight.result.data;
  const isLoading = preflight.status === "executing" || !data;
  const isMerging = merge.status === "executing";

  return (
    <Dialog open={open} onClose={onClose} size="2xl">
      <DialogTitle>Profielen samenvoegen</DialogTitle>
      <DialogBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
            <Text className="ml-2 !text-sm">Laden...</Text>
          </div>
        ) : (
          <>
            <Text className="!text-sm">
              <Strong>Primair profiel</Strong> (blijft bestaan):
            </Text>
            <PersonSummary
              person={data.primary.person}
              stats={data.primary.stats}
            />

            <Text className="mt-4 !text-sm">
              <Strong>Duplicaat</Strong> (wordt samengevoegd in primair):
            </Text>
            <PersonSummary
              person={data.duplicate.person}
              stats={data.duplicate.stats}
            />

            {data.warnings.length > 0 ? (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/10">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <ul className="space-y-1">
                    {data.warnings.map((w) => (
                      <li
                        key={w.type}
                        className="text-sm text-amber-800 dark:text-amber-300"
                      >
                        {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <Text className="mt-4 !text-xs !text-zinc-500">
              Samenvoegen is onomkeerbaar. Alle diploma's, cohortplekken en
              actoren van het duplicaat worden overgezet naar het primaire
              profiel. Het duplicaat-profiel wordt verwijderd.
            </Text>
          </>
        )}
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onClose} disabled={isMerging}>
          Annuleren
        </Button>
        <Button
          color="branding-orange"
          disabled={isLoading || isMerging}
          onClick={() =>
            merge.execute({
              primaryPersonId,
              duplicatePersonId,
              locationId,
              source,
            })
          }
        >
          {isMerging ? <Spinner className="text-white" /> : null}
          Bevestigen — samenvoegen
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PersonSummary({
  person,
  stats,
}: {
  person: {
    firstName: string | null;
    lastNamePrefix: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    handle: string | null;
  };
  stats: {
    actorCount: number;
    locationCount: number;
    certificateCount: number;
    logbookCount: number;
    roleCount: number;
    kwalificatieCount: number;
  };
}) {
  const fullName = [person.firstName, person.lastNamePrefix, person.lastName]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="rounded-md border border-zinc-950/10 bg-zinc-50 p-3 text-sm dark:border-white/10 dark:bg-zinc-900/50">
      <Strong className="!text-base">{fullName}</Strong>
      <Text className="!text-sm !text-zinc-600 dark:!text-zinc-400">
        {person.dateOfBirth ?? "—"}
        {person.handle ? ` · @${person.handle}` : ""}
      </Text>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-700 dark:text-zinc-400">
        <li>
          {stats.actorCount} {stats.actorCount === 1 ? "actor" : "actoren"}
        </li>
        <li>
          {stats.locationCount}{" "}
          {stats.locationCount === 1 ? "locatie" : "locaties"}
        </li>
        <li>
          {stats.certificateCount}{" "}
          {stats.certificateCount === 1 ? "diploma" : "diploma's"}
        </li>
        <li>{stats.logbookCount} logboek</li>
        <li>
          {stats.roleCount} {stats.roleCount === 1 ? "rol" : "rollen"}
        </li>
        <li>{stats.kwalificatieCount} kwalificaties</li>
      </ul>
    </div>
  );
}
