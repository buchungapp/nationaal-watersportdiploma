"use client";

import * as Headless from "@headlessui/react";
import { clsx } from "clsx";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { addStudentToCohortAction } from "~/actions/cohort/add-student-to-cohort-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/actions/safe-action";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Input } from "~/app/(dashboard)/_components/input";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import { listCountries, listPersonsForLocationByRole } from "../_actions/fetch";

interface Props {
  locationId: string;
  cohortId: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function Wrapper(props: Props) {
  const forceRerenderId = useRef(0);

  return (
    <CreateDialog
      key={String(forceRerenderId.current)}
      {...props}
      isOpen={props.isOpen}
      setIsOpen={(next) => {
        props.setIsOpen(next);
        forceRerenderId.current += 1;
      }}
    />
  );
}

function addStudentToCohortErrorMessage(
  error: InferUseActionHookReturn<typeof addStudentToCohortAction>["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.validationErrors) {
    return "Een van de velden is niet correct ingevuld.";
  }

  if (error.bindArgsValidationErrors) {
    return DEFAULT_SERVER_ERROR_MESSAGE;
  }

  return null;
}

function CreateDialog({ locationId, cohortId, isOpen, setIsOpen }: Props) {
  const { execute, result } = useAction(
    addStudentToCohortAction.bind(null, locationId, cohortId),
    {
      onSuccess: () => {
        setIsOpen(false);
        toast.success("Cursist is toegevoegd.");
      },
      onError: (error) => {
        toast.error(addStudentToCohortErrorMessage(error.error));
      },
    },
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>("nl");

  const [personQuery, setPersonQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  const { data: countries } = useSWR("countries", listCountries);
  const { data: allStudents } = useSWR(["allStudents", locationId], async () =>
    listPersonsForLocationByRole(locationId, "student"),
  );

  const [selectedStudent, setSelectedStudent] = useState<
    NonNullable<typeof allStudents>[number] | null
  >(null);

  if (!countries || !allStudents)
    throw new Error("Data must be available through fallback");

  const filteredCountries =
    countryQuery === ""
      ? countries
      : countries.filter((country) => {
          return country.name
            .toLowerCase()
            .includes(countryQuery.toLowerCase());
        });

  const filteredStudents = useMemo(
    () =>
      allStudents.filter(
        (x) =>
          personQuery.length < 1 ||
          [x.firstName, x.lastNamePrefix, x.lastName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(personQuery.toLowerCase()),
      ),
    [allStudents, personQuery],
  );

  return (
    <>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Cursist toevoegen</DialogTitle>

        <form action={execute}>
          <Field className="max-w-md">
            <Label>Vind een bestaande</Label>
            <Headless.Combobox
              name="person"
              onClose={() => setPersonQuery("")}
              value={selectedStudent}
              onChange={setSelectedStudent}
              virtual={{ options: filteredStudents }}
              multiple={false}
            >
              <div
                className={clsx([
                  // Basic layout
                  "group mt-3 relative block w-full",

                  // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
                  "before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm",

                  // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
                  "dark:before:hidden",

                  // Hide default focus styles
                  "focus:outline-hidden",

                  // Focus ring
                  "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent sm:data-focus:after:ring-2 sm:data-focus:after:ring-blue-500",

                  // Disabled state
                  "data-disabled:opacity-50 data-disabled:before:bg-zinc-950/5 data-disabled:before:shadow-none",
                ])}
              >
                <Headless.ComboboxInput
                  autoFocus={true}
                  data-slot="control"
                  displayValue={(
                    person: (typeof filteredStudents)[number] | undefined,
                  ) => {
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
                  onChange={(e) => setPersonQuery(e.target.value)}
                  data-invalid={
                    result?.validationErrors &&
                    "person[id]" in result.validationErrors &&
                    !!result.validationErrors["person[id]"]
                  }
                  className={clsx([
                    // Basic layout
                    "relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]",

                    // Set minimum height for when no value is selected
                    "min-h-11 sm:min-h-9",

                    // Horizontal padding
                    "pl-[calc(--spacing(3.5)-1px)] pr-[calc(--spacing(7)-1px)] sm:pl-[calc(--spacing(3)-1px)]",

                    // Typography
                    "text-left text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]",

                    // Border
                    "border border-zinc-950/10 group-data-active:border-zinc-950/20 group-data-hover:border-zinc-950/20 dark:border-white/10 dark:group-data-active:border-white/20 dark:group-data-hover:border-white/20",

                    // Background color
                    "bg-transparent dark:bg-white/5",

                    // Invalid state
                    "group-data-invalid:border-red-500 group-data-hover:group-data-invalid:border-red-500 dark:group-data-invalid:border-red-600 dark:data-hover:group-data-invalid:border-red-600",

                    // Disabled state
                    "group-data-disabled:border-zinc-950/20 group-data-disabled:opacity-100 dark:group-data-disabled:border-white/15 dark:group-data-disabled:bg-white/[2.5%] dark:group-data-disabled:data-hover:border-white/15",
                  ])}
                />
                <Headless.ComboboxButton
                  className={
                    "absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden"
                  }
                >
                  <span className="right-0 absolute inset-y-0 flex items-center pr-2 pointer-events-none">
                    <svg
                      className="stroke-zinc-500 dark:stroke-zinc-400 forced-colors:stroke-[CanvasText] group-data-disabled:stroke-zinc-600 size-5 sm:size-4"
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
                  </span>
                </Headless.ComboboxButton>

                <Headless.ComboboxOptions
                  as="div"
                  anchor={{
                    to: "bottom start",
                    gap: "var(--anchor-gap)",
                    offset: "var(--anchor-offset)",
                    padding: "var(--anchor-padding)",
                  }}
                  className={clsx(
                    // Anchor positioning
                    "[--anchor-offset:-1.625rem] [--anchor-padding:--spacing(4)] sm:[--anchor-offset:-1.375rem]",

                    // Base styles
                    "isolate w-max min-w-[calc(var(--button-width)+var(--input-width)+1.75rem)] empty:invisible select-none scroll-py-1 rounded-xl p-1",

                    // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
                    "outline outline-1 outline-transparent focus:outline-hidden",

                    // Handle scrolling when menu won't fit in viewport
                    "overflow-y-scroll overscroll-contain",

                    // Popover background
                    "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",

                    // Shadows
                    "shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10",
                  )}
                >
                  {({
                    option: person,
                  }: {
                    option: (typeof filteredStudents)[number];
                  }) => {
                    const fullName = [
                      person.firstName,
                      person.lastNamePrefix,
                      person.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <ComboboxOption
                        key={person.id}
                        value={person}
                        className="inset-x-0"
                      >
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
                  }}
                </Headless.ComboboxOptions>
              </div>
            </Headless.Combobox>
          </Field>

          <Divider className="my-6" />
          <Subheading>Maak een nieuwe</Subheading>

          <DialogBody>
            <Fieldset disabled={!!selectedStudent}>
              <FieldGroup>
                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-3">
                  <Field>
                    <Label>Voornaam</Label>
                    <Input
                      name="firstName"
                      invalid={
                        result?.validationErrors &&
                        "firstName" in result.validationErrors &&
                        !!result.validationErrors.firstName
                      }
                      required
                      minLength={1}
                    />
                  </Field>
                  <Field>
                    <Label>Tussenvoegsel</Label>
                    <Input
                      name="lastNamePrefix"
                      invalid={
                        result?.validationErrors &&
                        "lastNamePrefix" in result.validationErrors &&
                        !!result.validationErrors.lastNamePrefix
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Achternaam</Label>
                    <Input
                      name="lastName"
                      invalid={
                        result?.validationErrors &&
                        "lastName" in result.validationErrors &&
                        !!result.validationErrors.lastName
                      }
                      required
                      minLength={1}
                    />
                  </Field>
                </div>

                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-5">
                  <Field className="sm:col-span-3">
                    <Label>E-mail</Label>
                    <Input
                      name="email"
                      type="email"
                      invalid={
                        result?.validationErrors &&
                        "email" in result.validationErrors &&
                        !!result.validationErrors.email
                      }
                      required
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <Label>Geboortedatum</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      invalid={
                        result?.validationErrors &&
                        "dateOfBirth" in result.validationErrors &&
                        !!result.validationErrors.dateOfBirth
                      }
                      required
                    />
                  </Field>
                </div>

                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <Field>
                    <Label>Geboorteplaats</Label>
                    <Input
                      name="birthCity"
                      invalid={
                        result?.validationErrors &&
                        "birthCity" in result.validationErrors &&
                        !!result.validationErrors.birthCity
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteland</Label>
                    <Combobox
                      name="birthCountry"
                      invalid={
                        result?.validationErrors &&
                        "birthCountry" in result.validationErrors &&
                        !!result.validationErrors.birthCountry
                      }
                      value={selectedCountry}
                      setQuery={setCountryQuery}
                      onChange={(value) => setSelectedCountry(value)}
                      displayValue={(value: string | null) => {
                        if (!value) return "";
                        const country = countries.find(
                          (country) => country.code === value,
                        );
                        return country?.name ?? "";
                      }}
                      defaultValue="nl"
                    >
                      {filteredCountries.map((country) => (
                        <ComboboxOption key={country.code} value={country.code}>
                          <ComboboxLabel>{country.name}</ComboboxLabel>
                        </ComboboxOption>
                      ))}
                    </Combobox>
                  </Field>
                </div>
              </FieldGroup>
            </Fieldset>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Sluiten
            </Button>
            <SubmitButton />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Toevoegen
    </Button>
  );
}
