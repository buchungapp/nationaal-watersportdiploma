"use client";

import dayjs from "dayjs";
import { useRef, useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { ZodError, z } from "zod";
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
import { addStudentsToCohort } from "../_actions/create";
import { listCountries } from "../_actions/nwd";

interface Props {
  locationId: string;
  cohortId: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

interface CSVData {
  labels: { label: string; value: (string | null | undefined)[] }[] | null;
  rows: string[][] | null;
}

const COLUMN_MAPPING = [
  "E-mailadres",
  "Voornaam",
  "Tussenvoegsels",
  "Achternaam",
  "Geboortedatum",
  "Geboorteplaats",
  "Geboorteland",
  "Tag",
] as const;

const SELECT_LABEL = "Niet importeren";

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

    const headers = data[0]!;

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
              <ul className="list-inside list-disc">
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
            setIsOpen={setIsOpen}
          />
        )}
      </Dialog>
    </>
  );
}

function SubmitForm({
  data,
  locationId,
  cohortId,
  setIsOpen,
}: {
  data: CSVData;
  locationId: string;
  cohortId: string;
  setIsOpen: (value: boolean) => void;
}) {
  const { data: countries } = useSWR("countries", listCountries);

  if (!countries) throw new Error("Data must be available through fallback");

  const submit = async (
    csvData: string[][] | null | undefined,
    prevState:
      | {
          success: boolean;
          persons?: {
            email: string;
            firstName: string;
            lastNamePrefix: string | null;
            lastName: string;
            dateOfBirth: Date;
            birthCity: string;
            birthCountry: string;
            tags: string[];
          }[];
          message?: string;
        }
      | undefined,
    formData: FormData,
  ) => {
    if (prevState?.success) {
      const result = await addStudentsToCohort(
        locationId,
        cohortId,
        prevState.persons!,
      );
      setIsOpen(false);

      if (result.message === "Success") {
        toast.success("Personen zijn toegevoegd.");
      } else {
        console.error("result", result.errors);
        toast.error("Er is een fout opgetreden.");
      }
      return;
    }

    try {
      if (!csvData) {
        throw new Error("Geen data gevonden.");
      }

      const indexToColumnSelection = Object.fromEntries(formData);
      const selectedFields = Object.values(indexToColumnSelection).filter(
        (item) => item !== SELECT_LABEL,
      );
      const notSelectedIndices = Object.entries(indexToColumnSelection)
        .filter(([_, value]) => value === SELECT_LABEL)
        .map(([key]) => parseInt(key.split("-").pop()!));

      const filteredData = csvData.map((item) =>
        item.filter((_, index) => !notSelectedIndices.includes(index)),
      );

      const count = filteredData[0]?.length ?? 0;

      const minimalExpectedCount = COLUMN_MAPPING.filter(
        (col) => col !== "Tag",
      ).length;
      const missingFields = COLUMN_MAPPING.filter(
        (item) => !selectedFields.includes(item),
      );

      if (missingFields.length > 0) {
        throw new Error(`Missende velden in data: ${missingFields.join(", ")}`);
      }

      if (count < minimalExpectedCount) {
        throw new Error("Je hebt minder kolommen geplakt dan verwacht.");
      }

      const nonTagColumns = COLUMN_MAPPING.filter((col) => col !== "Tag");

      // Sort the data for each tuple in filteredData so that it appears
      // in the order that we have in COLUMNS.
      const sortedData = filteredData.map((row) => {
        const sortedRow = Array(nonTagColumns.length).fill(null);
        const tags: string[] = [];

        row.forEach((value, index) => {
          const column = selectedFields[index];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          const columnIndex = nonTagColumns.indexOf(column as any);

          if (columnIndex !== -1) {
            sortedRow[columnIndex] = value;
          } else if (value && value.length > 0) {
            tags.push(value);
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
        return [...sortedRow, ...tags];
      });

      const calculateMaxLength = (data: string[][] | undefined): number => {
        if (!data || data.length === 0) return 0;
        return Math.max(...data.map((row) => row.length));
      };

      const maxLength = calculateMaxLength(sortedData);
      const tagColumnsCount = Math.max(0, maxLength - nonTagColumns.length);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const COLUMNS: string[] = [
        ...nonTagColumns,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...Array(tagColumnsCount).fill("Tag"),
      ];

      const personRowSchema = z
        .tuple([
          z.string().trim().toLowerCase().email(),
          z.string().trim(),
          z
            .string()
            .trim()
            .transform((v) => v || null),
          z.string(),
          z.string().pipe(z.coerce.date()),
          z.string(),
          z
            .preprocess(
              (value) => (value === "" ? "nl" : value),
              z.enum(countries.map((c) => c.code) as [string, ...string[]], {
                message: "Ongeldige landcode",
              }),
            )
            .default("nl"),
        ])
        .rest(z.string().nullish());

      const rows = personRowSchema.array().parse(sortedData);

      return {
        success: true,
        columns: COLUMNS,
        persons: rows.map(
          ([
            email,
            firstName,
            lastNamePrefix,
            lastName,
            dateOfBirth,
            birthCity,
            birthCountry,
            ...tags
          ]) => ({
            email,
            firstName,
            lastNamePrefix,
            lastName,
            dateOfBirth,
            birthCity,
            birthCountry,
            tags: tags.filter(Boolean) as string[],
          }),
        ),
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          message: JSON.stringify(error.flatten().fieldErrors),
        };
      }

      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: "Er is een onverwachte fout opgetreden.",
      };
    }
  };

  const [state, formAction] = useActionState(
    submit.bind(null, data?.rows),
    undefined,
  );

  return (
    <form action={formAction}>
      {state?.success === true ? (
        <>
          <DialogDescription>
            Er zijn <Strong>{state?.persons?.length}</Strong> cursisten
            gevonden. Controleer de geïmporteerde data en klik op "Verder" om
            door te gaan.
          </DialogDescription>
          <DialogBody>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader />
                  {state.columns?.map((item) => (
                    <TableHeader key={item}>{item}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {state.persons?.map((person, index) => (
                  <TableRow key={JSON.stringify(person)}>
                    <TableCell className="text-right tabular-nums">{`${index + 1}.`}</TableCell>
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
                      <TableCell key={index}>{tag}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                    <TableRow key={index}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell className="space-x-2">
                        {item.value
                          .filter((val) => !!val)
                          .map((value, index) => (
                            <Code key={index}>{String(value)}</Code>
                          ))}
                      </TableCell>
                      <TableCell>
                        <Select
                          name={`include-column-${index}`}
                          defaultValue={
                            COLUMN_MAPPING.find((col) =>
                              item?.label
                                .toLowerCase()
                                .startsWith(col.toLowerCase()),
                            ) ?? SELECT_LABEL
                          }
                          className="min-w-48"
                        >
                          <option value={SELECT_LABEL}>{SELECT_LABEL}</option>
                          {COLUMN_MAPPING.map((column) => (
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
              {!!state?.message && <ErrorMessage>{state.message}</ErrorMessage>}
            </div>
          </DialogBody>
        </>
      )}
      <DialogActions>
        <Button plain onClick={() => setIsOpen(false)}>
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
      Verder
    </Button>
  );
}
