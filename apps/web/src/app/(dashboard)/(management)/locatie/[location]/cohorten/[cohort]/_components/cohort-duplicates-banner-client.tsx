"use client";

import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import { OperatorMergeConfirmDialog } from "~/app/_components/persons/operator-merge-confirm-dialog";

type Person = {
  id: string;
  firstName: string | null;
  lastNamePrefix: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  email: string | null;
  isPrimary: boolean;
  createdAt: string;
};

type Pair = {
  score: number;
  primary: Person;
  duplicate: Person;
};

// Banner above the cohort roster announcing detected duplicates within
// this cohort. Click "Bekijk" to open a modal with the pair list. Each
// pair → operator merge confirm dialog with source='cohort_view'.

export function CohortDuplicatesBannerClient({
  pairs,
  locationId,
}: {
  pairs: Pair[];
  locationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{
    primaryId: string;
    duplicateId: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-branding-orange/40 bg-branding-orange/5 p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0 text-branding-orange" />
          <div>
            <Strong className="!text-sm">
              {pairs.length}{" "}
              {pairs.length === 1
                ? "mogelijk dubbel profiel"
                : "mogelijke dubbele profielen"}{" "}
              in dit cohort
            </Strong>
            <Text className="!text-sm !text-zinc-700 dark:!text-zinc-300">
              Sommige cursisten lijken op elkaar. Controleer en voeg samen
              waar nodig — zo blijven diploma-historie en voortgang gekoppeld
              aan één profiel.
            </Text>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button color="branding-orange" onClick={() => setOpen(true)}>
            Bekijk
          </Button>
          <button
            type="button"
            aria-label="Banner sluiten"
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-950/5 dark:hover:bg-white/10"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} size="3xl">
        <DialogTitle>Mogelijke duplicaten in dit cohort</DialogTitle>
        <DialogBody>
          <Text className="!text-sm">
            {pairs.length}{" "}
            {pairs.length === 1 ? "paar profielen" : "paren profielen"} dat op
            dezelfde persoon kan wijzen. Klik op "Beoordeel" om een paar te
            samenvoegen.
          </Text>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeader>Mate van overeenkomst</TableHeader>
                <TableHeader>Primair</TableHeader>
                <TableHeader>Duplicaat</TableHeader>
                <TableHeader />
              </TableRow>
            </TableHead>
            <TableBody>
              {pairs.map((pair) => (
                <TableRow key={`${pair.primary.id}-${pair.duplicate.id}`}>
                  <TableCell>
                    <Badge
                      color={pair.score >= 200 ? "blue" : "amber"}
                    >
                      {pair.score >= 200 ? "Exacte match" : "Sterke match"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PersonCell person={pair.primary} />
                  </TableCell>
                  <TableCell>
                    <PersonCell person={pair.duplicate} />
                  </TableCell>
                  <TableCell>
                    <Button
                      plain
                      onClick={() =>
                        setTarget({
                          primaryId: pair.primary.id,
                          duplicateId: pair.duplicate.id,
                        })
                      }
                    >
                      Beoordeel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setOpen(false)}>
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {target ? (
        <OperatorMergeConfirmDialog
          open
          onClose={() => setTarget(null)}
          onMerged={() => setTarget(null)}
          primaryPersonId={target.primaryId}
          duplicatePersonId={target.duplicateId}
          locationId={locationId}
          source="cohort_view"
        />
      ) : null}
    </>
  );
}

function PersonCell({ person }: { person: Person }) {
  const fullName = [person.firstName, person.lastNamePrefix, person.lastName]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="space-y-0.5">
      <div className="text-sm font-medium text-zinc-950 dark:text-white">
        {fullName}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        {person.dateOfBirth ?? "—"}
        {person.email ? ` · ${person.email}` : ""}
      </div>
    </div>
  );
}
