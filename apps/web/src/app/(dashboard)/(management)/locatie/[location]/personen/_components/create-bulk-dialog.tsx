"use client";

import dayjs from "dayjs";
import { useRef, useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
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
  Fieldset,
  Legend,
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
import {
  Code,
  Strong,
  Text,
  TextLink,
} from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { createPersonBulk } from "../_actions/create";

const _ROLES = [
  {
    type: "student",
    label: "Cursist",
    description: "Kan toegevoegd worden aan cohorten.",
    defaultChecked: true,
  },
  {
    type: "instructor",
    label: "Instructeur",
    description:
      "Geeft lessen, kan toegevoegd worden aan cohorten en kan de diplomalijn inzien.",
  },
] as const;

interface Props {
  locationId: string;
  countries: { code: string; name: string }[];
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
];

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

function CreateDialog({ locationId, isOpen, setIsOpen, countries }: Props) {
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
        <DialogTitle>Personen toevoegen (bulk)</DialogTitle>

        {isUpload ? (
          <form onSubmit={handleSubmit}>
            <DialogBody>
              <Fieldset>
                <Legend>Data</Legend>
                <Text>
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
                  </ul>
                </Text>
                <Textarea name="data" required />
              </Fieldset>

              {/* <Fieldset className="mt-6">
                <Legend>Rollen</Legend>
                <Text>
                  Welke rol(len) vervullen deze personen in jullie locatie?
                </Text>
                <CheckboxGroup>
                  {ROLES.map((role) => (
                    <CheckboxField key={role.type}>
                      <Checkbox
                        name={`role-${role.type}`}
                        defaultChecked={
                          "defaultChecked" in role && role.defaultChecked
                        }
                      />
                      <Label>{role.label}</Label>
                      <Description>{role.description}</Description>
                    </CheckboxField>
                  ))}
                </CheckboxGroup>
              </Fieldset> */}
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
            countries={countries}
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
  countries,
  setIsOpen,
}: {
  data: CSVData;
  locationId: string;
  countries: { code: string; name: string }[];
  setIsOpen: (value: boolean) => void;
}) {
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
          }[];
          message?: string;
        }
      | undefined,
    formData: FormData,
  ) => {
    if (!!prevState?.success) {
      const result = await createPersonBulk(locationId, prevState.persons!);
      setIsOpen(false);

      if (result.message === "Success") {
        toast.success("Personen zijn toegevoegd.");
        return;
      }

      console.log("result", result.errors);

      toast.error("Er is een fout opgetreden.");
      return;
    }

    try {
      const mappingConfig = Object.fromEntries(formData);

      const selectedFields = Object.keys(mappingConfig)
        .map((key) => mappingConfig[key])
        .filter((item) => item !== SELECT_LABEL);

      // Exclude data if "Select one" is selected
      const notSelectedIndices = Object.keys(mappingConfig)
        .filter((key) => mappingConfig[key] === SELECT_LABEL)
        // @ts-expect-error Fix later
        .map((key) => parseInt(key.split("-").pop()));

      const filteredData = csvData?.map((item) =>
        item.filter((_, index) => !notSelectedIndices.includes(index)),
      );

      // Validate if columns are correctly pasted
      const count = filteredData?.[0]?.length ?? 0;
      const expectedCount = COLUMN_MAPPING.length;

      const mappingFields = COLUMN_MAPPING;
      const missingFields = mappingFields.filter(
        (item) => !selectedFields.includes(item),
      );

      if (missingFields.length > 0) {
        throw new Error(`Missende velden in data: ${missingFields.join(", ")}`);
      }

      if (count < expectedCount) {
        throw new Error("Je hebt minder kolommen geplakt dan verwacht.");
      }

      if (count > expectedCount) {
        throw new Error("Je hebt te veel kolommen geselecteerd.");
      }

      // Sort data so that we can parse it correctly.
      const indices = selectedFields.map((columnName) =>
        COLUMN_MAPPING.findIndex((key) => key === columnName),
      );

      const sortedData = filteredData?.map((row) =>
        indices.map((index) => row[index]),
      );

      const personRowSchema = z.tuple([
        z.string().trim().toLowerCase().email(),
        z.string().trim(),
        z
          .string()
          .trim()
          .transform((tussenvoegsel) =>
            tussenvoegsel === "" ? null : tussenvoegsel,
          ),
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
      ]);

      const rows = personRowSchema.array().parse(sortedData);

      return {
        success: true,
        persons: rows.map(
          ([
            email,
            firstName,
            lastNamePrefix,
            lastName,
            dateOfBirth,
            birthCity,
            birthCountry,
          ]) => ({
            email,
            firstName,
            lastNamePrefix,
            lastName,
            dateOfBirth,
            birthCity,
            birthCountry,
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
            Er zijn <Strong>{state?.persons?.length}</Strong> personen gevonden.
            Controleer de geïmporteerde data en klik op "Verder" om door te
            gaan.
          </DialogDescription>
          <DialogBody>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader />
                  {COLUMN_MAPPING.map((item) => (
                    <TableHeader key={item}>{item}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {state?.persons?.map((person, index) => (
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
