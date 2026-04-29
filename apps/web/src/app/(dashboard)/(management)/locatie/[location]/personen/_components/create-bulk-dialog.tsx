"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  commitBulkImportAction,
  previewBulkImportAction,
} from "~/app/_actions/person/bulk-import-actions";
import {
  COLUMN_MAPPING,
  type CSVData,
  SELECT_LABEL,
} from "~/app/_actions/person/person-bulk-csv-mappings";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
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
import dayjs from "~/lib/dayjs";
import type { ActorType } from "~/lib/nwd";
import { invariant } from "~/utils/invariant";
import { use } from "react";
import {
  assertPreviewContext,
  BulkImportPreviewContext,
} from "./import-preview/context";
import { BulkImportPreviewProvider } from "./import-preview/provider";
import { PreviewStep } from "./import-preview/PreviewStep";
import type {
  PreviewMatches,
  PreviewModel,
  RowDecision,
} from "./import-preview/types";

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

type ImportRoles = ("student" | "instructor" | "location_admin")[] & [
  "student" | "instructor" | "location_admin",
  ...("student" | "instructor" | "location_admin")[],
];

function CreateDialog({ locationId, isOpen, setIsOpen, countries }: Props) {
  const [isUpload, setIsUpload] = useState(true);
  const [data, setData] = useState<CSVData>({ labels: null, rows: null });

  const [hasSelectedRole, setHasSelectedRole] = useState(true);
  const [roles, setRoles] = useState<ImportRoles | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const raw = formData.get("data") as string;
    const selected = ROLES.filter((role) =>
      formData.has(`role-${role.type}`),
    ).map((role) => role.type);

    if (selected.length < 1) {
      setHasSelectedRole(false);
      setRoles(null);
      return;
    }

    const splitRows = raw
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t"));

    const headers = splitRows[0];
    invariant(headers, "Data must contain at least one row.");

    splitRows.shift();

    const labels = headers.map((header, item) => {
      return {
        label: header,
        value: splitRows.slice(0, 2).map((row) => row[item]),
      };
    });

    setData({ labels, rows: splitRows });
    setRoles(
      selected.filter(
        (r): r is "student" | "instructor" | "location_admin" =>
          r === "student" || r === "instructor" || r === "location_admin",
      ) as ImportRoles,
    );
    setIsUpload(false);
  };

  return (
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
          close={() => setIsOpen(false)}
        />
      )}
    </Dialog>
  );
}

type Step = "mapping" | "preview" | "invalidated_max";

function SubmitForm({
  data,
  roles,
  locationId,
  countries,
  close,
}: {
  data: CSVData;
  roles: ImportRoles;
  locationId: string;
  countries: { code: string; name: string }[];
  close: () => void;
}) {
  const [step, setStep] = useState<Step>("mapping");
  const [previewModel, setPreviewModel] = useState<PreviewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [raceBanner, setRaceBanner] = useState<string | null>(null);

  // Default column-mapping suggestions inferred from header text.
  const defaultMapping: Record<string, string> = {};
  data.labels?.forEach((item, index) => {
    defaultMapping[`include-column-${index}`] =
      COLUMN_MAPPING.find((col) =>
        item?.label.toLowerCase().startsWith(col.toLowerCase()),
      ) ?? SELECT_LABEL;
  });

  const previewBound = previewBulkImportAction.bind(
    null,
    locationId,
    roles,
    data,
    countries,
    undefined, // targetCohortId — Phase 2.5 doesn't support cohort selection here
  );

  const previewExec = useAction(previewBound, {
    onSuccess: ({ data: result }) => {
      if (!result) {
        setErrorMessage(DEFAULT_SERVER_ERROR_MESSAGE);
        return;
      }
      if (result.kind === "needs-mapping") {
        setStep("mapping");
        return;
      }
      if (result.kind === "previewed") {
        setPreviewModel({
          previewToken: result.previewToken,
          attempt: result.attempt,
          parsedRows: result.parsedRows.map((r) => ({
            ...r,
            dateOfBirth: new Date(r.dateOfBirth),
          })),
          parseErrors: result.parseErrors,
          matches: result.matches as PreviewMatches,
        });
        setStep("preview");
        setErrorMessage(null);
      }
    },
    onError: () => setErrorMessage(DEFAULT_SERVER_ERROR_MESSAGE),
  });

  const commitExec = useAction(commitBulkImportAction, {
    onSuccess: ({ data: result }) => {
      setCommitting(false);
      if (!result) {
        setErrorMessage(DEFAULT_SERVER_ERROR_MESSAGE);
        return;
      }
      const r = result as
        | { kind: "committed"; createdPersonIds: string[]; linkedPersonIds: string[] }
        | { kind: "preview_invalidated"; attempt: 2 | 3; updatedMatches: PreviewMatches }
        | { kind: "preview_invalidated_max"; message: string };

      if (r.kind === "committed") {
        const total = r.createdPersonIds.length + r.linkedPersonIds.length;
        toast.success(`${total} ${total === 1 ? "persoon" : "personen"} toegevoegd.`);
        close();
        return;
      }
      if (r.kind === "preview_invalidated") {
        if (previewModel) {
          setPreviewModel({
            ...previewModel,
            attempt: r.attempt,
            matches: r.updatedMatches,
          });
        }
        setRaceBanner(
          "Roster veranderde tijdens je review — bekijk de gemarkeerde rijen.",
        );
        return;
      }
      if (r.kind === "preview_invalidated_max") {
        setStep("invalidated_max");
        return;
      }
    },
    onError: () => {
      setCommitting(false);
      setErrorMessage(DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  const onMappingSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const indexToColumnSelection: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      if (typeof v === "string") indexToColumnSelection[k] = v;
    }
    previewExec.execute(indexToColumnSelection);
  };

  if (step === "invalidated_max") {
    return (
      <>
        <DialogBody>
          <ErrorMessage>
            Roster veranderde te vaak tijdens je review — plak opnieuw.
          </ErrorMessage>
          <Text className="!text-sm">
            Andere collega's hebben tijdens je preview wijzigingen aan de
            personen-lijst gemaakt. Sluit deze dialoog en plak je rijen opnieuw
            voor een verse check.
          </Text>
        </DialogBody>
        <DialogActions>
          <Button color="branding-dark" onClick={close}>
            Sluiten
          </Button>
        </DialogActions>
      </>
    );
  }

  if (step === "preview" && previewModel) {
    return (
      <BulkImportPreviewProvider
        initialPreview={previewModel}
        locationId={locationId}
        roles={roles}
      >
        <DialogBody>
          {raceBanner ? (
            <ErrorMessage className="mb-4">{raceBanner}</ErrorMessage>
          ) : null}
          <CommitConsumer
            previewModel={previewModel}
            roles={roles}
            locationId={locationId}
            onCancel={close}
            committing={committing}
            onCommit={(payload) => {
              setCommitting(true);
              setRaceBanner(null);
              commitExec.execute(payload);
            }}
          />
        </DialogBody>
      </BulkImportPreviewProvider>
    );
  }

  // step === "mapping"
  const isPending = previewExec.status === "executing";

  return (
    <form onSubmit={onMappingSubmit}>
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
            {data?.labels?.map((item, index) => (
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
                    defaultValue={defaultMapping[`include-column-${index}`]}
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
            ))}
          </TableBody>
        </Table>
        {errorMessage ? (
          <div className="pt-4">
            <ErrorMessage>{errorMessage}</ErrorMessage>
          </div>
        ) : null}
      </DialogBody>
      <DialogActions>
        <Button plain onClick={close}>
          Sluiten
        </Button>
        <Button color="branding-dark" type="submit" disabled={isPending}>
          {isPending ? <Spinner className="text-white" /> : null}
          Volgende — matches zoeken
        </Button>
      </DialogActions>
    </form>
  );
}

// Renders inside the BulkImportPreviewProvider so it can read the provider's
// decisions when the operator hits "Bevestigen en importeren". Hands the
// commit payload back up to the parent for execution.

function CommitConsumer({
  previewModel,
  roles,
  locationId,
  onCancel,
  onCommit,
  committing,
}: {
  previewModel: PreviewModel;
  roles: ImportRoles;
  locationId: string;
  onCancel: () => void;
  committing: boolean;
  onCommit: (payload: {
    previewToken: string;
    locationId: string;
    roles: ImportRoles;
    decisions: Record<string, RowDecision>;
    candidateInputsByRowIndex: Record<
      string,
      {
        email: string;
        firstName: string;
        lastNamePrefix: string | null;
        lastName: string;
        dateOfBirth: string;
        birthCity: string;
        birthCountry: string;
      }
    >;
  }) => void;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));

  const handleSubmit = () => {
    const decisions: Record<string, RowDecision> = {};
    for (const [rowIndex, decision] of ctx.state.decisions) {
      decisions[String(rowIndex)] = decision;
    }
    const candidateInputsByRowIndex: Record<
      string,
      {
        email: string;
        firstName: string;
        lastNamePrefix: string | null;
        lastName: string;
        dateOfBirth: string;
        birthCity: string;
        birthCountry: string;
      }
    > = {};
    for (const row of previewModel.parsedRows) {
      candidateInputsByRowIndex[String(row.rowIndex)] = {
        email: row.email,
        firstName: row.firstName,
        lastNamePrefix: row.lastNamePrefix,
        lastName: row.lastName,
        dateOfBirth: dayjs(row.dateOfBirth).format("YYYY-MM-DD"),
        birthCity: row.birthCity,
        birthCountry: row.birthCountry,
      };
    }
    onCommit({
      previewToken: previewModel.previewToken,
      locationId,
      roles,
      decisions,
      candidateInputsByRowIndex,
    });
  };

  return (
    <PreviewStep
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitting={committing}
    />
  );
}
