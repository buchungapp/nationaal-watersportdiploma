"use client";
import dayjs from "dayjs";
import { useRef } from "react";
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
import { listCountries } from "~/lib/nwd";
import { createPersonBulk } from "../_actions/create";

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

function CreateDialog({ locationId, isOpen, setIsOpen }: Props) {
  const { data: countries } = useSWR("countries", listCountries);

  if (!countries) throw new Error("Data must be available through fallback");

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

    // Try to parse the data from TSV to JSON
    let data;
    try {
      data = raw
        // Splits the raw TSV data into an array of lines
        .split("\n")
        // Filters out any lines that are empty or consist only of whitespace.
        .filter((line) => line.trim() !== "")
        // Splits each non-empty line by tabs into an array of values.
        .map((line) => line.split("\t"));

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

  const [state, formAction] = useActionState(submit, undefined);

  const parseSuccess = state?.success === true;

  return (
    <>
      <Dialog open={isOpen} onClose={setIsOpen} size="5xl">
        <DialogTitle>Personen toevoegen (bulk)</DialogTitle>
        <DialogDescription>
          {parseSuccess ? (
            <>
              Er zijn <Strong>{state.persons!.length}</Strong> personen
              gevonden. Controleer de geïmporteerde data en klik op "Verder" om
              door te gaan.
            </>
          ) : (
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
          )}
        </DialogDescription>
        <form action={formAction}>
          <DialogBody>
            {parseSuccess ? (
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
                  {state.persons!.map((person, index) => (
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
            ) : (
              <Fieldset>
                <Field>
                  <Label>Data</Label>
                  <Textarea name="data" required />
                </Field>
                {!!state?.message && (
                  <ErrorMessage>{state.message}</ErrorMessage>
                )}
              </Fieldset>
            )}
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
      Verder
    </Button>
  );
}
