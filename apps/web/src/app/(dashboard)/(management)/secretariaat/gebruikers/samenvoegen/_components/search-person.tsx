"use client";
import { formatters } from "@nawadi/lib";
import { clsx } from "clsx";
import { useQueryStates } from "nuqs";
import { useTransition } from "react";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import type { listPersonsWithPagination } from "~/lib/nwd";
import { searchParams } from "../_search-params";

const formatPersonName = formatters.formatPersonName;

export default function SearchPerson({
  persons,
  personParam,
}: {
  persons: Awaited<ReturnType<typeof listPersonsWithPagination>>;
  personParam: keyof typeof searchParams;
}) {
  const [isPersonsLoading, startTransition] = useTransition();
  const [_, setQuery] = useQueryStates(
    {
      query: searchParams.query,
      [personParam]: searchParams[personParam],
    },
    {
      startTransition,
      shallow: false,
    },
  );

  return (
    <div className="relative w-full">
      <Combobox
        name="person"
        options={persons.items}
        displayValue={(person) => (person ? formatPersonName(person) : "")}
        placeholder="Zoek een persoon..."
        value={null}
        setQuery={(query) => {
          setQuery((prev) => ({
            ...prev,
            query,
          }));
        }}
        onChange={(person) => {
          setQuery((prev) => ({
            ...prev,
            [personParam]: person?.id,
          }));
        }}
        filter={() => true}
      >
        {(person) => (
          <ComboboxOption key={person.id} value={person} className="inset-x-0">
            <ComboboxLabel>
              <div className="flex">
                <span className={clsx("truncate")}>
                  {[person.firstName, person.lastNamePrefix, person.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </span>
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
        )}
      </Combobox>
      {isPersonsLoading && (
        <div className="right-8 absolute inset-y-0 flex items-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
