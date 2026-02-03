"use client";

import type { InferUseStateActionHookReturn } from "next-safe-action/hooks";
import { useStateAction } from "next-safe-action/stateful-hooks";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  ErrorMessage,
  Field,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Select } from "~/app/(dashboard)/_components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Code, Strong, TextLink } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { addStudentsToCohortAction } from "~/app/_actions/cohort/add-students-to-cohort-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import {
  COLUMN_MAPPING_WITH_TAG,
  type CSVData,
  SELECT_LABEL,
} from "~/app/_actions/person/person-bulk-csv-mappings";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import { invariant } from "~/utils/invariant";
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

function CreateDialog({ locationId, isOpen, setIsOpen, cohortId }: Props) {
  const [isUpload, setIsUpload] = useState(true);
  const [data, setData] = useState<CSVData>({ labels: null, rows: null });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const raw = formData.get("data") as string;

    const data = raw
      // Splits the raw TSV data into an array of lines
      .split("\n")
      // Filters out any lines that are empty or consist only of whitespace.
      .filter((line) => line.trim() !== "")
      // Splits each non-empty line by tabs into an array of values.
      .map((line) => line.split("\t"));

    const headers = data[0];
    invariant(headers, "Data must contain at least one row.");

    // Remove the header row
    data.shift();

    const labels = headers.map((header, item) => {
      return {
        label: header,
        value: data.slice(0, 2).map((row) => row[item]),
      };
    });

    setData({ labels, rows: data });
    setIsUpload(false);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={setIsOpen} size="5xl">
        <DialogTitle>Cursisten toevoegen (bulk)</DialogTitle>

        {isUpload ? (
          <form onSubmit={handleSubmit}>
            <DialogDescription>
              Importeer data door deze te kopiëren en plakken vanuit het{" "}
              <TextLink
                href="https://docs.google.com/spreadsheets/d/1et2mVz12w65ZDSvwVMGE1rIQyaesr4DDkeb-Fq5SUsc/template/preview"
                target="_blank"
              >
                template
              </TextLink>{" "}
              of je eigen databron. <br /> Let op het volgende:
              <ul className="list-disc list-inside">
                <li>Zorg dat de kolomnamen worden meegekopieerd.</li>
                <li>
                  Gebruik het formaat <Code>YYYY-MM-DD</Code>{" "}
                  <i>(jaar-maand-dag)</i> voor geboortedata.
                </li>
                <li>
                  Tags kunnen aangemaakt worden door extra kolommen toe te
                  voegen, waarbij elke extra kolom een tag representeert. <br />
                  <i>
                    Tip: Start de naam van de kolom met 'Tag' om deze
                    automatisch te kunnen herkennen.
                  </i>
                </li>
              </ul>
            </DialogDescription>
            <DialogBody>
              <Fieldset>
                <Field>
                  <Label>Data</Label>
                  <Textarea name="data" required />
                </Field>
              </Fieldset>
            </DialogBody>
            <DialogActions>
              <Button plain onClick={() => setIsOpen(false)}>
                Sluiten
              </Button>
              <Button color="branding-dark" type="submit">
                Verder
              </Button>
            </DialogActions>
          </form>
        ) : (
          <SubmitForm
            data={data}
            cohortId={cohortId}
            locationId={locationId}
            close={() => setIsOpen(false)}
          />
        )}
      </Dialog>
    </>
  );
}

function addStudentsToCohortBulkErrorMessage(
  error: InferUseStateActionHookReturn<
    typeof addStudentsToCohortAction
  >["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.validationErrors) {
    return "Een van de velden is niet correct ingevuld.";
  }

  return null;
}

function SubmitForm({
  data,
  locationId,
  cohortId,
  close,
}: {
  data: CSVData;
  locationId: string;
  cohortId: string;
  close: () => void;
}) {
  const { data: countries } = useSWR("countries", listCountries);

  if (!countries) throw new Error("Data must be available through fallback");

  const { execute, result, input } = useStateAction(
    addStudentsToCohortAction.bind(null, locationId, cohortId, data, countries),
    {
      onSuccess: ({ data }) => {
        if (data?.state !== "submitted") return;

        close();
        toast.success("Personen zijn toegevoegd.");
      },
      onError: () => {
        if (result.data?.state !== "parsed") return;

        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input ?? undefined, {
    ...data?.labels?.reduce(
      (acc, item, index) => {
        acc[`include-column-${index}`] =
          COLUMN_MAPPING_WITH_TAG.find((col) =>
            item?.label.toLowerCase().startsWith(col.toLowerCase()),
          ) ?? SELECT_LABEL;
        return acc;
      },
      {} as Record<string, string>,
    ),
  });

  const errorMessage = addStudentsToCohortBulkErrorMessage(result);

  return (
    <form action={execute}>
      {result.data?.state === "parsed" ? (
        <>
          <DialogDescription>
            Er zijn <Strong>{result.data?.persons?.length}</Strong> cursisten
            gevonden. Controleer de geïmporteerde data en klik op "Verder" om
            door te gaan.
          </DialogDescription>
          <DialogBody>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader />
                  {result.data?.columns?.map((item) => (
                    <TableHeader key={item}>{item}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {result.data?.persons?.map((person, index) => (
                  <TableRow key={JSON.stringify(person)}>
                    <TableCell className="tabular-nums text-right">{`${index + 1}.`}</TableCell>
                    <TableCell className="font-medium">
                      {person.email}
                    </TableCell>
                    <TableCell>{person.firstName}</TableCell>
                    <TableCell>{person.lastNamePrefix}</TableCell>
                    <TableCell>{person.lastName}</TableCell>
                    <TableCell>
                      {dayjs(person.dateOfBirth).format("DD-MM-YYYY")}
                    </TableCell>
                    <TableCell>{person.birthCity}</TableCell>
                    <TableCell>
                      {countries.find((c) => c.code === person.birthCountry)
                        ?.name ?? person.birthCountry}
                    </TableCell>
                    {person.tags.map((tag, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      <TableCell key={index}>{tag}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="pt-4">
              {errorMessage ? (
                <ErrorMessage>{errorMessage}</ErrorMessage>
              ) : null}
            </div>
          </DialogBody>
        </>
      ) : (
        <>
          <DialogDescription>
            Voeg de kolommen van je data toe aan de juiste velden.
          </DialogDescription>
          <DialogBody>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Kolom</TableHeader>
                  <TableHeader>Voorbeelddata</TableHeader>
                  <TableHeader>Doel</TableHeader>
                </TableRow>
              </TableHead>

              <TableBody>
                {data?.labels?.map((item, index) => {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <TableRow key={index}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell className="space-x-2">
                        {item.value
                          .filter((val) => !!val)
                          .map((value, index) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            <Code key={index}>{String(value)}</Code>
                          ))}
                      </TableCell>
                      <TableCell>
                        <Select
                          name={`include-column-${index}`}
                          defaultValue={getInputValue(
                            `include-column-${index}`,
                          )}
                          className="min-w-48"
                        >
                          <option value={SELECT_LABEL}>{SELECT_LABEL}</option>
                          {COLUMN_MAPPING_WITH_TAG.map((column) => (
                            <option key={column} value={column}>
                              {column}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="pt-4">
              {errorMessage ? (
                <ErrorMessage>{errorMessage}</ErrorMessage>
              ) : null}
            </div>
          </DialogBody>
        </>
      )}
      <DialogActions>
        <Button plain onClick={close}>
          Sluiten
        </Button>
        <SubmitButton />
      </DialogActions>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Verder
    </Button>
  );
}
