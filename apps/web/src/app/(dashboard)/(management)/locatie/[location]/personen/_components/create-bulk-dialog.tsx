"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import dayjs from "~/lib/dayjs";

import type { InferUseStateActionHookReturn } from "next-safe-action/hooks";
import { useStateAction } from "next-safe-action/stateful-hooks";
import { createPersonsAction } from "~/actions/person/create-persons-action";
import {
  COLUMN_MAPPING,
  type CSVData,
  SELECT_LABEL,
} from "~/actions/person/person-bulk-csv-mappings";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/actions/safe-action";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Description,
  ErrorMessage,
  Fieldset,
  Label,
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
import Spinner from "~/app/_components/spinner";
import type { ActorType } from "~/lib/nwd";
import { invariant } from "~/utils/invariant";

const ROLES: {
  type: ActorType;
  label: string;
  description: string;
  defaultChecked?: boolean;
}[] = [
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

  const [hasSelectedRole, setHasSelectedRole] = useState(true);
  const [roles, setRoles] = useState<[ActorType, ...ActorType[]] | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const raw = formData.get("data") as string;
    const roles = ROLES.filter((role) => formData.has(`role-${role.type}`)).map(
      (role) => role.type,
    );

    if (roles.length < 1) {
      setHasSelectedRole(false);
      setRoles(null);
      return;
    }

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
    setRoles(roles as [ActorType, ...ActorType[]]);
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
                  <ul className="list-disc list-inside">
                    <li>Zorg dat de kolomnamen worden meegekopieerd.</li>
                    <li>
                      Gebruik het formaat <Code>YYYY-MM-DD</Code>{" "}
                      <i>(jaar-maand-dag)</i> voor geboortedata.
                    </li>
                  </ul>
                </Text>
                <Textarea name="data" required />
              </Fieldset>

              <Fieldset className="mt-6">
                <Legend>Rollen</Legend>
                <Text>
                  Welke rol(len) vervullen deze personen in jullie locatie?
                </Text>
                {!hasSelectedRole && (
                  <ErrorMessage>
                    Selecteer minimaal één rol voor de personen.
                  </ErrorMessage>
                )}
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
            countries={countries}
            // biome-ignore lint/style/noNonNullAssertion: roles is set when upload is completed
            roles={roles!}
            locationId={locationId}
            setIsOpen={setIsOpen}
          />
        )}
      </Dialog>
    </>
  );
}

function createPersonsErrorMessage(
  error: InferUseStateActionHookReturn<typeof createPersonsAction>["result"],
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

function SubmitForm({
  data,
  roles,
  locationId,
  countries,
  setIsOpen,
}: {
  data: CSVData;
  roles: [ActorType, ...ActorType[]];
  locationId: string;
  countries: { code: string; name: string }[];
  setIsOpen: (value: boolean) => void;
}) {
  const { execute, result } = useStateAction(
    createPersonsAction.bind(null, locationId, data, countries),
    {
      onSuccess: ({ data }) => {
        if (data?.state !== "submitted") return;

        setIsOpen(false);
        toast.success("Personen zijn toegevoegd.");
      },
      onError: () => {
        if (result.data?.state !== "parsed") return;

        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const errorMessage = createPersonsErrorMessage(result);

  return (
    <form action={execute}>
      {result.data?.state === "parsed" ? (
        <>
          <DialogDescription>
            Er zijn <Strong>{result.data?.persons?.length}</Strong> personen
            gevonden. Controleer de geïmporteerde data en klik op "Verder" om
            door te gaan.
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
                    <TableRow key={item.label}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell className="space-x-2">
                        {item.value
                          .filter((val) => !!val)
                          .map((value) => (
                            <Code key={value}>{String(value)}</Code>
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
              {errorMessage ? (
                <ErrorMessage>{errorMessage}</ErrorMessage>
              ) : null}
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
      {pending ? <Spinner className="text-white" /> : null}
      Verder
    </Button>
  );
}
