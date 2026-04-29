"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { getDedupHintAction } from "~/app/_actions/person/dedup-hint-action";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";

// Inline dedup hint shown beneath the name + DOB fields in the single-
// create dialog. Watches the operator's typed values and surfaces strong+
// matches in their location. The endpoint is rate-limited (10/min/operator)
// so threshold-probing exfiltration is bounded — see dedup-hint-action.ts.
//
// The hint renders nothing until firstName + dateOfBirth are both populated
// (no point checking with sparse input). Debounces input by 500ms so each
// keystroke doesn't fire a network call.

export function DedupHint({
  locationId,
  firstName,
  lastName,
  lastNamePrefix,
  dateOfBirth,
  email,
}: {
  locationId: string;
  firstName: string;
  lastName: string;
  lastNamePrefix: string;
  dateOfBirth: string;
  email: string;
}) {
  const [debounced] = useDebounce(
    { firstName, lastName, lastNamePrefix, dateOfBirth, email },
    500,
  );
  const [hidden, setHidden] = useState(false);

  const hint = useAction(getDedupHintAction);

  useEffect(() => {
    setHidden(false);
    if (!debounced.firstName || debounced.firstName.length < 2) return;
    if (!debounced.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(debounced.dateOfBirth))
      return;
    hint.execute({
      locationId,
      firstName: debounced.firstName.trim(),
      lastName: debounced.lastName.trim() || null,
      lastNamePrefix: debounced.lastNamePrefix.trim() || null,
      dateOfBirth: debounced.dateOfBirth,
      birthCity: "",
      email: debounced.email.trim() || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debounced.firstName,
    debounced.lastName,
    debounced.lastNamePrefix,
    debounced.dateOfBirth,
    debounced.email,
  ]);

  const candidates = hint.result.data?.candidates ?? [];
  if (hidden || candidates.length === 0) return null;

  return (
    <div
      className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/10"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="flex-1 space-y-2">
          <Strong className="!text-sm">
            Lijkt op een bestaand profiel in jouw locatie
          </Strong>
          {candidates.slice(0, 3).map((c) => {
            const fullName = [c.firstName, c.lastNamePrefix, c.lastName]
              .filter(Boolean)
              .join(" ");
            const dob = c.dateOfBirth
              ? dayjs(c.dateOfBirth).format("DD-MM-YYYY")
              : "—";
            return (
              <div
                key={c.personId}
                className="rounded border border-zinc-950/10 bg-white p-2 text-sm dark:border-white/10 dark:bg-zinc-900/50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{fullName}</span>
                  <Badge color={c.score >= 200 ? "blue" : "amber"}>
                    {c.score >= 200 ? "Vrijwel zeker dezelfde" : "Mogelijk dezelfde"}
                  </Badge>
                </div>
                <Text className="!text-xs !text-zinc-600 dark:!text-zinc-400">
                  {dob}
                  {c.certificateCount > 0
                    ? ` · ${c.certificateCount} diploma${c.certificateCount === 1 ? "" : "'s"}`
                    : ""}
                </Text>
              </div>
            );
          })}
          <Text className="!text-xs !text-zinc-600 dark:!text-zinc-400">
            Bestaat deze persoon al? Open in plaats daarvan het bestaande
            profiel via de personenlijst. Toch nieuw aanmaken? Vul het
            formulier af en klik op opslaan.
          </Text>
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="text-xs text-zinc-500 underline-offset-2 hover:underline"
          >
            Verberg deze tip
          </button>
        </div>
      </div>
    </div>
  );
}
