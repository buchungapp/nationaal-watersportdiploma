"use client";

import dayjs from "dayjs";
import { useRef, useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { ZodError, z } from "zod";
import { createPersonBulk } from "~/app/(dashboard)/(management)/locatie/[location]/personen/_actions/create";
import { Button } from "~/app/(dashboard)/_components/button";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
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
  const upload = (_prevState: undefined, formData: FormData) => {
    const raw = formData.get("data") as string;

    // Try to parse the data from CSV to JSON
    let data;
    let headers;
    try {
      console.log("🔴 raw data: \n", raw);
      data = raw
        // Splits the raw TSV data into an array of lines
        .split("\n")
        // Filters out any lines that are empty or consist only of whitespace.
        .filter((line) => line.trim() !== "")
        // Splits each non-empty line by tabs into an array of values.
        .map((line) => line.split("\t"));

      headers = data[0]!;

      // Check that a header row is present
      if (data.length < 2) {
        throw new Error("Data moet een header bevatten");
      }

      // Remove the header row
      data.shift();

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

      const rows = personRowSchema.array().parse(data);

      const labels = headers.map((header, item) => {
        return {
          label: header,
          value: rows[0] ? rows[0][item] : null,
        };
      });

      // Set next step in the wizzard.
      setStep(2);

      return {
        success: true,
        data: { rows, labels },
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

  const submit = async (
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
    // const prevStep = prevState?.step ?? 0;
    // const step = prevStep + 1;
    // console.log("Fire in the disco! 🔥", step);

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

    const raw = formData.get("data") as string;

    // Try to parse the data from CSV to JSON
    let data;
    let headerData;
    try {
      console.log("🔴 raw data: \n", raw);
      data = raw
        // Splits the raw TSV data into an array of lines
        .split("\n")
        // Filters out any lines that are empty or consist only of whitespace.
        .filter((line) => line.trim() !== "")
        // Splits each non-empty line by tabs into an array of values.
        .map((line) => line.split("\t"));

      headerData = data[0]!;

      console.log("🟢 data: \n", headerData);

      // Check that a header row is present
      if (data.length < 2) {
        throw new Error("Data moet een header bevatten");
      }

      const expectedHeader = [
        "E-mailadres",
        "Voornaam",
        "Tussenvoegsels",
        "Achternaam",
        "Geboortedatum",
        "Geboorteplaats",
        "Geboorteland (indien niet nl)",
      ];

      const header = data[0]!;

      // TODO: Fix this check 🚨
      if (header.length !== expectedHeader.length) {
        throw new Error("Je hebt minder kolommen geplakt dan verwacht");
      }

      // Check that the header row matches the expected header
      for (let i = 0; i < header.length; i++) {
        if (header[i] !== expectedHeader[i]) {
          throw new Error(
            `De naam van kolom "${header[i]}" is niet volgens het template`,
          );
        }
      }

      // Remove the header row
      data.shift();

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

      const rows = personRowSchema.array().parse(data);

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

  const [step, setStep] = useState(1);

  // TODO: Fix TS error
  const [uploadState, uploadFormAction] = useActionState(upload, undefined);
  const [submitState, submitFormAction] = useActionState(submit, undefined);

  // TODO: Fix
  const parseSuccess = uploadState?.success === true;

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

          {step === 2 ? (
            <>
              Er zijn <Strong>{uploadState?.data?.rows?.length}</Strong>{" "}
              personen gevonden. Controleer de geïmporteerde data en klik op
              "Verder" om door te gaan.
            </>
          ) : null}
        </DialogDescription>

        {/* TODO: UploadForm */}
        {step === 1 ? (
          <form action={uploadFormAction}>
            <DialogBody>
              <Fieldset>
                <Field>
                  <Label>Data</Label>
                  <Textarea name="data" required />
                </Field>
                {!!uploadState?.message && (
                  <ErrorMessage>{uploadState.message}</ErrorMessage>
                )}
              </Fieldset>
            </DialogBody>
            <DialogActions>
              <Button plain onClick={() => setIsOpen(false)}>
                Sluiten
              </Button>
              <SubmitButton />
            </DialogActions>
          </form>
        ) : (
          // Todo: SubmitForm 👈 here we have to bind the `rows` and `columnMap`
          <form action={submitFormAction}>
            <DialogBody>
              {step === 2 ? (
                <>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Your File Column</TableHeader>
                        <TableHeader>Your Sample Data</TableHeader>
                        <TableHeader>Destination Column</TableHeader>
                        <TableHeader>Include</TableHeader>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {uploadState?.data?.labels?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item?.label}</TableCell>
                          {/* TODO: Fix Date */}
                          <TableCell>{String(item?.value)}</TableCell>
                          <TableCell>
                            <Select name={`column-map-${index}`}>
                              <option>Select one</option>
                              <option value="email">E-mailadres</option>
                              <option value="firstName">Voornaam</option>
                              <option value="lastNamePrefix">
                                Tussenvoegsels
                              </option>
                              <option value="lastName">Achternaam</option>
                              <option value="dateOfBirth">Geboortedatum</option>
                              <option value="birthCity">Geboorteplaats</option>
                              <option value="birthCountry">Geboorteland</option>
                            </Select>
                          </TableCell>
                          {/* TODO: Do we need include if we change `Select one` to `None`. */}
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <pre>
                    {JSON.stringify(uploadState?.data?.labels, null, 2)}
                  </pre>
                </>
              ) : null}

              {step === 3 ? (
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
                      {submitState?.persons?.map((person, index) => (
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
                            {countries.find(
                              (c) => c.code === person.birthCountry,
                            )?.name ?? person.birthCountry}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <pre>{JSON.stringify(submitState?.persons, null, 2)}</pre>
                </>
              ) : null}
            </DialogBody>
            <DialogActions>
              <Button plain onClick={() => setIsOpen(false)}>
                Sluiten
              </Button>

              <SubmitButton />
            </DialogActions>
          </form>
        )}
      </Dialog>
    </>
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
