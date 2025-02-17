"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import dayjs from "~/lib/dayjs";
import type { listPersonsForLocationByRole } from "~/lib/nwd";
import { addInstructorToCohortByPersonId } from "../../_actions/nwd";

export function AddInstructor({
  cohortId,
  locationId,
  allInstructors,
}: {
  locationId: string;
  cohortId: string;
  allInstructors: Awaited<ReturnType<typeof listPersonsForLocationByRole>>;
}) {
  const [forceRerenderId, setForceRerenderId] = useState(0);
  const [personQuery, setPersonQuery] = useState("");

  return (
    <div className="max-w-lg">
      <Subheading>Snel toevoegen</Subheading>
      <Combobox
        key={forceRerenderId}
        autoFocus={true}
        name="personId"
        setQuery={setPersonQuery}
        onChange={async (personId) => {
          if (!personId) return;

          await addInstructorToCohortByPersonId({
            cohortId,
            locationId,
            personId,
          })
            .then(() => {
              toast.success("Instructeur toegevoegd");
              setForceRerenderId((prev) => prev + 1);
            })
            .catch(() => {
              toast.error("Er is een fout opgetreden");
            });
        }}
        displayValue={(value: string) => {
          const person = allInstructors.find((person) => person.id === value);

          if (!person) return "";

          const fullName = [
            person.firstName,
            person.lastNamePrefix,
            person.lastName,
          ]
            .filter(Boolean)
            .join(" ");

          return fullName;
        }}
      >
        {allInstructors
          .filter(
            (x) =>
              personQuery.length < 1 ||
              [x.firstName, x.lastNamePrefix, x.lastName]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(personQuery.toLowerCase()),
          )
          .map((person) => {
            const fullName = [
              person.firstName,
              person.lastNamePrefix,
              person.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <ComboboxOption key={person.id} value={person.id}>
                <ComboboxLabel>
                  <div className="flex">
                    <span className={clsx("truncate")}>{fullName}</span>
                    <span
                      className={clsx(
                        "ml-2 truncate text-slate-500 group-data-active/option:text-white",
                      )}
                    >
                      {person.dateOfBirth
                        ? dayjs(person.dateOfBirth).format("DD-MM-YYYY")
                        : null}
                    </span>
                  </div>
                </ComboboxLabel>
              </ComboboxOption>
            );
          })}
      </Combobox>
    </div>
  );
}
