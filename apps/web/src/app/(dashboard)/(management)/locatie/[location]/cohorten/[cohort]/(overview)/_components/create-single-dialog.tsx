"use client";
import clsx from "clsx";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { addStudentToCohortAction } from "~/app/_actions/cohort/add-student-to-cohort-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import Spinner from "~/app/_components/spinner";
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
import { usePersonsForLocation } from "~/app/(dashboard)/_hooks/swr/use-persons-for-location";
import dayjs from "~/lib/dayjs";
import { listCountries } from "../_actions/fetch";

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

  return null;
}

function CreateDialog({ locationId, cohortId, isOpen, setIsOpen }: Props) {
  const close = () => {
    setIsOpen(false);
    reset();
  };

  const { execute, result, input, reset } = useAction(
    addStudentToCohortAction.bind(null, locationId, cohortId),
    {
      onSuccess: () => {
        close();
        toast.success("Cursist is toegevoegd.");
      },
      onError: (error) => {
        toast.error(addStudentToCohortErrorMessage(error.error));
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  const [personQuery, setPersonQuery] = useState<string | null>(null);

  const { data: countries } = useSWR("countries", listCountries);
  const { data: searchedStudents, isLoading: isPersonsLoading } =
    usePersonsForLocation(locationId, {
      filter: {
        actorType: "student",
        query: personQuery,
      },
    });
  const [selectedStudent, setSelectedStudent] = useState<
    NonNullable<typeof searchedStudents>["items"][number] | null
  >(
    searchedStudents?.items.find((x) => x.id === getInputValue("person")?.id) ??
      null,
  );

  if (!countries)
    throw new Error("Country data must be available through fallback");

  if (!searchedStudents)
    throw new Error("Person list data must be available through fallback");

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>Cursist toevoegen</DialogTitle>

      <form action={execute}>
        <Field className="max-w-md">
          <Label>Vind een bestaande</Label>
          <div className="relative w-full">
            <Combobox
              name="person"
              options={searchedStudents.items}
              value={selectedStudent}
              onChange={setSelectedStudent}
              displayValue={(person) =>
                !person
                  ? ""
                  : [person.firstName, person.lastNamePrefix, person.lastName]
                      .filter(Boolean)
                      .join(" ")
              }
              invalid={
                result?.validationErrors &&
                "person[id]" in result.validationErrors &&
                !!result.validationErrors["person[id]"]
              }
              setQuery={setPersonQuery}
              filter={() => true}
            >
              {(person) => (
                <ComboboxOption
                  key={person.id}
                  value={person}
                  className="inset-x-0"
                >
                  <ComboboxLabel>
                    <div className="flex">
                      <span className={clsx("truncate")}>
                        {[
                          person.firstName,
                          person.lastNamePrefix,
                          person.lastName,
                        ]
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
                    defaultValue={getInputValue("firstName")}
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
                    defaultValue={getInputValue("lastNamePrefix")}
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
                    defaultValue={getInputValue("lastName")}
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
                    defaultValue={getInputValue("email")}
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
                    defaultValue={getInputValue("dateOfBirth")}
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
                    defaultValue={getInputValue("birthCity")}
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
                    options={countries}
                    displayValue={(country) => country?.name}
                    defaultValue={countries.find(
                      (country) =>
                        country.code === getInputValue("birthCountry")?.code,
                    )}
                  >
                    {(country) => (
                      <ComboboxOption key={country.code} value={country}>
                        <ComboboxLabel>{country.name}</ComboboxLabel>
                      </ComboboxOption>
                    )}
                  </Combobox>
                </Field>
              </div>
            </FieldGroup>
          </Fieldset>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={close}>
            Sluiten
          </Button>
          <SubmitButton />
        </DialogActions>
      </form>
    </Dialog>
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
