"use client";

import dayjs from "dayjs";
import { useRef, useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { ZodError } from "zod";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Field, Fieldset, Label } from "~/app/(dashboard)/_components/fieldset";
import { Select } from "~/app/(dashboard)/_components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Code, TextLink } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { createPersonBulk } from "../_actions/create";

interface Props {
  locationId: string;
  countries: { code: string; name: string }[];
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

function CreateDialog({ locationId, isOpen, setIsOpen, countries }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState([{ labels: [], rows: [] }]);

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
        value: data[0] ? data[0][item] : null,
      };
    });

    setData({ labels, rows: data });
    setStep(2);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={setIsOpen} size="5xl">
        <DialogTitle>Personen toevoegen (bulk)</DialogTitle>
        <DialogDescription>
          {step === 1 ? (
            <>
              Kopier en plak de data vanuit het{" "}
              <TextLink
                href="https://docs.google.com/spreadsheets/d/1et2mVz12w65ZDSvwVMGE1rIQyaesr4DDkeb-Fq5SUsc/template/preview"
                target="_blank"
              >
                template
              </TextLink>
              . <br /> Zorg ervoor dat de geboortedatum in het formaat{" "}
              <Code>YYYY-MM-DD</Code> <i>(2010-12-31)</i> is.
            </>
          ) : null}

          {/* TODO: It's better to co-locate the <DialogDescriptions /> 🚨 */}
          {step === 2 ? (
            <>
              {/* Er zijn <Strong>{uploadState?.data?.rows?.length}</Strong>{" "} */}
              personen gevonden. Controleer de geïmporteerde data en klik op
              "Verder" om door te gaan.
            </>
          ) : null}
        </DialogDescription>

        {step === 1 ? (
          <form onSubmit={handleSubmit}>
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
          // Todo: SubmitForm 👈 here we have to bind the `rows` and `columnMap`
          <SubmitForm
            data={data}
            step={step}
            countries={countries}
            locationId={locationId}
            setIsOpen={setIsOpen}
          />
        )}
      </Dialog>
    </>
  );
}

// TODO: Move to correct place
type ColumnKey =
  | "E-mailadres"
  | "Voornaam"
  | "Tussenvoegsels"
  | "Select one"
  | "Achternaam"
  | "Geboortedatum"
  | "Geboorteplaats"
  | "Geboorteland (indien niet nl)";

type ColumnsConfig = Record<string, ColumnKey>;

function SubmitForm({
  data,
  locationId,
  countries,
  setIsOpen,
}: {
  // TODO: Update this type 🚨
  data: [][];
  locationId: string;
  countries: { code: string; name: string }[];
  setIsOpen: (value: boolean) => void;
}) {
  const submit = async (
    csvData: { labels: { label: string; value: string }[]; rows: string[][] },
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
    const columnsConfig = Object.fromEntries(formData);

    // TODO: Is this the correct place to keep column mapping?
    const columnMapping = {
      "E-mailadres": "email",
      Voornaam: "firstName",
      Tussenvoegsels: "lastNamePrefix",
      Achternaam: "lastName",
      Geboortedatum: "dateOfBirth",
      Geboorteplaats: "birthCity",
      "Geboorteland (indien niet nl)": "birthCountry",
    };

    console.log("🔴 csvData", csvData);
    console.log("🎉 columnsConfig", columnsConfig);

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
      const generateColumnsToInclude = (config: ColumnsConfig) => {
        const columnsToInclude: { index: number; key: string }[] = [];

        for (const [key, value] of Object.entries(config)) {
          if (value !== "Select one" && columnMapping[value]) {
            const index = parseInt(key.split("-")[2], 10);
            columnsToInclude.push({ index, key: columnMapping[value] });
          }
        }

        return columnsToInclude;
      };

      const columnsToInclude = generateColumnsToInclude(columnsConfig);
      console.log("🟠 columnsToInclude", columnsToInclude);

      // Transform the data based on the columns to include and schema
      const transformData = (data: any[][]) => {
        return data.map((row) => {
          const obj: Record<string, any> = {};

          columnsToInclude.forEach(({ index, key }) => {
            obj[key] = row[index];
          });

          return obj;
        });
      };
      const transformedData = transformData(csvData);
      console.log("🟢 transformedData", transformedData);

      // const header = data[0]!;

      // TODO: Fix this check 🚨
      // if (header.length !== columnMapping.length) {
      //   throw new Error("Je hebt minder kolommen geplakt dan verwacht");
      // }

      // TODO: Fix this check 🚨
      // Check that the header row matches the expected header
      // for (let i = 0; i < header.length; i++) {
      //   if (header[i] !== columnMapping[i]) {
      //     throw new Error(
      //       `De naam van kolom "${header[i]}" is niet volgens het template`,
      //     );
      //   }
      // }

      // Remove the header row
      // data.shift();

      // const personRowSchema = z.tuple([
      //   z.string().trim().toLowerCase().email(),
      //   z.string().trim(),
      //   z
      //     .string()
      //     .trim()
      //     .transform((tussenvoegsel) =>
      //       tussenvoegsel === "" ? null : tussenvoegsel,
      //     ),
      //   z.string(),
      //   z.string().pipe(z.coerce.date()),
      //   z.string(),
      //   z
      //     .preprocess(
      //       (value) => (value === "" ? "nl" : value),
      //       z.enum(countries.map((c) => c.code) as [string, ...string[]], {
      //         message: "Ongeldige landcode",
      //       }),
      //     )
      //     .default("nl"),
      // ]);

      // const rows = personRowSchema.array().parse(transformedData);
      // console.log("🟢 rows", rows);

      return {
        success: true,
        persons: transformedData,
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

  // TODO: Fix
  const parseSuccess = state?.success === true;

  const columns = [
    "E-mailadres",
    "Voornaam",
    "Tussenvoegsels",
    "Achternaam",
    "Geboortedatum",
    "Geboorteplaats",
    "Geboorteland (indien niet nl)",
  ];

  return (
    <form action={formAction}>
      <DialogBody>
        {state?.success === true ? (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader />
                  <TableHeader>E-mailadres</TableHeader>
                  <TableHeader>Voornaam</TableHeader>
                  <TableHeader>Tussenvoegsel</TableHeader>
                  <TableHeader>Achternaam</TableHeader>
                  <TableHeader>Geboortedatum</TableHeader>
                  <TableHeader>Geboorteplaats</TableHeader>
                  <TableHeader>Geboorteland</TableHeader>
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
            <pre>{JSON.stringify(state?.persons, null, 2)}</pre>
          </>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Your File Column</TableHeader>
                  <TableHeader>Your Sample Data</TableHeader>
                  <TableHeader>Destination Column</TableHeader>
                </TableRow>
              </TableHead>

              {/* TODO: Fix error message 🚨 */}
              {/* {!!state?.message && (
                  <ErrorMessage>{state.message}</ErrorMessage>
              )} */}

              <TableBody>
                {/* TODO: state?.data?.labels */}
                {data?.labels?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item?.label}</TableCell>
                    {/* TODO: Fix Date */}
                    <TableCell>{String(item?.value)}</TableCell>
                    <TableCell>
                      <Select
                        name={`include-column-${index}`}
                        value={item?.label || "Select one"}
                      >
                        <option value="Select one">Select one</option>
                        {columns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <pre>{JSON.stringify(data?.labels, null, 2)}</pre>
          </>
        )}
      </DialogBody>
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
