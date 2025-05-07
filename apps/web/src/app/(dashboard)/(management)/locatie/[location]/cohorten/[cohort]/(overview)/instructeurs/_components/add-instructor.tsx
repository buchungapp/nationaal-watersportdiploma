"use client";

import { clsx } from "clsx";
import { parseAsString, useQueryState } from "nuqs";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addInstructorToCohortAction } from "~/actions/cohort/add-instructor-to-cohort-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/actions/safe-action";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import type { listPersonsForLocationWithPagination } from "~/lib/nwd";

export function AddInstructor({
  cohortId,
  locationId,
  searchedInstructors,
}: {
  locationId: string;
  cohortId: string;
  searchedInstructors: Awaited<
    ReturnType<typeof listPersonsForLocationWithPagination>
  >["items"];
}) {
  const [forceRerenderId, setForceRerenderId] = useState(0);
  const [isSearchPending, startTransition] = useTransition();

  const [query, setQuery] = useQueryState(
    "query",
    parseAsString.withOptions({
      startTransition,
      // https://nuqs.47ng.com/docs/options#throttling-url-updates
      throttleMs: 300,
      shallow: false,
    }),
  );

  return (
    <div className="max-w-lg">
      <Subheading>Snel toevoegen</Subheading>
      <div className="relative w-full">
        <Combobox
          key={forceRerenderId}
          autoFocus={true}
          name="personId"
          setQuery={(value) => {
            const valueWithNull = value === "" ? null : value;
            if (valueWithNull === query) return;
            setQuery(valueWithNull);
          }}
          onChange={async (personId) => {
            if (!personId) return;

            await addInstructorToCohortAction(locationId, cohortId, personId)
              .then(() => {
                toast.success("Instructeur toegevoegd");
                setForceRerenderId((prev) => prev + 1);
              })
              .catch(() => {
                toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
              });
          }}
          displayValue={(value: string) => {
            const person = searchedInstructors.find(
              (person) => person.id === value,
            );

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
          {searchedInstructors.map((person) => {
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
                        "ml-2 text-slate-500 group-data-active/option:text-white truncate",
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
        {isSearchPending && (
          <div className="right-8 absolute inset-y-0 flex items-center">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  );
}
