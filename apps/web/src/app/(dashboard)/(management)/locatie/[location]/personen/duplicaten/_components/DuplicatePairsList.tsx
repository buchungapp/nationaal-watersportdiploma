"use client";

import { useState } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
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

// Client component that renders the pair list and orchestrates the
// operator merge dialog. The server fetches the pairs and passes them
// in via props — this component owns the dialog open/close state and
// the "which pair am I merging right now" target.

export function DuplicatePairsList({
  pairs,
  locationId,
}: {
  pairs: Pair[];
  locationId: string;
}) {
  const [target, setTarget] = useState<{
    primaryId: string;
    duplicateId: string;
  } | null>(null);

  if (pairs.length === 0) {
    return (
      <div className="rounded-md border border-zinc-950/10 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-zinc-900/50">
        <Strong>Geen mogelijke duplicaten gevonden — netjes!</Strong>
        <Text className="!text-sm !text-zinc-600 dark:!text-zinc-400">
          Er zijn geen pares profielen in jouw locatie die op dezelfde persoon
          lijken.
        </Text>
      </div>
    );
  }

  return (
    <>
      <Text className="!text-sm">
        {pairs.length} {pairs.length === 1 ? "paar profielen" : "paren profielen"}{" "}
        die op dezelfde persoon kunnen wijzen. Hoogste score eerst.
      </Text>

      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeader>Score</TableHeader>
            <TableHeader>Primair profiel</TableHeader>
            <TableHeader>Mogelijk duplicaat</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>
          {pairs.map((pair) => (
            <TableRow key={`${pair.primary.id}-${pair.duplicate.id}`}>
              <TableCell>
                <ScoreBadge score={pair.score} />
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

      {target ? (
        <OperatorMergeConfirmDialog
          open
          onClose={() => setTarget(null)}
          onMerged={() => setTarget(null)}
          primaryPersonId={target.primaryId}
          duplicatePersonId={target.duplicateId}
          locationId={locationId}
          source="personen_page"
        />
      ) : null}
    </>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color: Parameters<typeof Badge>[0]["color"] =
    score >= 200 ? "blue" : score >= 150 ? "amber" : "zinc";
  const label =
    score >= 200 ? "Exact" : score >= 150 ? "Sterke match" : "Mogelijk";
  return (
    <Badge color={color}>
      {label} · {score}
    </Badge>
  );
}

function PersonCell({ person }: { person: Person }) {
  const fullName = [person.firstName, person.lastNamePrefix, person.lastName]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="space-y-0.5">
      <div className="font-medium text-zinc-950 dark:text-white">{fullName}</div>
      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        {person.dateOfBirth ?? "—"}
        {person.email ? ` · ${person.email}` : ""}
      </div>
    </div>
  );
}
