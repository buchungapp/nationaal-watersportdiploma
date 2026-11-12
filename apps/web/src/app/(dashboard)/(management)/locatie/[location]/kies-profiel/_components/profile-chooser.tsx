"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { setActingProfileForLocationAction } from "~/app/_actions/location/set-acting-profile-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { Badge } from "~/app/(dashboard)/_components/badge";

const ROLE_LABELS = {
  location_admin: "Beheerder",
  instructor: "Instructeur",
} as const;

type EligiblePerson = {
  personId: string;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string | null;
  roles: Array<keyof typeof ROLE_LABELS>;
};

function fullName(person: EligiblePerson): string {
  return [person.firstName, person.lastNamePrefix, person.lastName]
    .filter((part) => part != null && part !== "")
    .join(" ");
}

export function ProfileChooser({
  locationId,
  next,
  eligiblePersons,
}: {
  locationId: string;
  next: string;
  eligiblePersons: EligiblePerson[];
}) {
  const router = useRouter();
  const [pendingPersonId, setPendingPersonId] = useState<string | null>(null);

  const { execute } = useAction(setActingProfileForLocationAction, {
    onSuccess: () => {
      router.push(next);
    },
    onError: ({ error }) => {
      setPendingPersonId(null);
      toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  return (
    <ul className="mt-6 space-y-3">
      {eligiblePersons.map((person) => {
        const isPending = pendingPersonId === person.personId;
        const disabled = pendingPersonId !== null;

        return (
          <li key={person.personId}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setPendingPersonId(person.personId);
                execute({ locationId, personId: person.personId });
              }}
              className="flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-950/10 bg-white px-4 py-3 text-left transition hover:border-zinc-950/20 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900/30 dark:hover:bg-zinc-800/40"
            >
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-zinc-900 dark:text-white">
                  {fullName(person)}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {person.roles.map((role) => (
                    <Badge key={role} color="branding-orange">
                      {ROLE_LABELS[role]}
                    </Badge>
                  ))}
                </div>
              </div>
              {isPending ? <Spinner /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
