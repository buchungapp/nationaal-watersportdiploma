"use client";

import { useAction } from "next-safe-action/hooks";
import { use, useRef, useState } from "react";
import { toast } from "sonner";
import {
  commitBulkImportAction,
  previewBulkImportAction,
} from "~/app/_actions/person/bulk-import-actions";
import {
  COLUMN_MAPPING,
  COLUMN_MAPPING_WITH_TAG,
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
import { Code, Text, TextLink } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import dayjs from "~/lib/dayjs";
import type { ActorType } from "~/lib/nwd";
import { invariant } from "~/utils/invariant";
import {
  assertPreviewContext,
  BulkImportPreviewContext,
} from "./import-preview/context";
import { PreviewStep } from "./import-preview/PreviewStep";
import { BulkImportPreviewProvider } from "./import-preview/provider";
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
  // ── Variant props (defaults match the personen-page flow) ────────────
  // When set, skips the role picker and uses these roles unconditionally.
  // Cohort variant passes ["student"]; personen variant leaves undefined.
  fixedRoles?: ImportRoles;
  // Cohort variant passes the cohort id; the preview/commit flow then
  // surfaces "already-in-cohort" rows and tags travel with the
  // cohort_allocation row.
  targetCohortId?: string;
  // When true, the column-mapping dropdown includes "Tag" — the operator
  // can map N columns as Tag and those values become per-row tags
  // applied to each cohort_allocation. Cohort variant only.
  enableTags?: boolean;
  // Localized title + success toast wording for the variant.
  dialogTitle?: string;
  successToast?: (count: number) => string;
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

type ImportRoles = ("student" | "instructor" | "location_admin")[] &
  [
    "student" | "instructor" | "location_admin",
    ...("student" | "instructor" | "location_admin")[],
  ];

function CreateDialog({
  locationId,
  isOpen,
  setIsOpen,
  countries,
  fixedRoles,
  targetCohortId,
  enableTags = false,
  dialogTitle = "Personen toevoegen (bulk)",
  successToast = (n) => `${n} ${n === 1 ? "persoon" : "personen"} toegevoegd.`,
}: Props) {
  const [isUpload, setIsUpload] = useState(true);
  const [data, setData] = useState<CSVData>({ labels: null, rows: null });

  const [hasSelectedRole, setHasSelectedRole] = useState(true);
  const [roles, setRoles] = useState<ImportRoles | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const raw = formData.get("data") as string;
    // Cohort variant skips the role picker and uses fixedRoles.
    const selected = fixedRoles
      ? [...fixedRoles]
      : ROLES.filter((role) => formData.has(`role-${role.type}`)).map(
          (role) => role.type,
        );

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
      <DialogTitle>{dialogTitle}</DialogTitle>

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

            {fixedRoles ? null : (
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
            )}
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
          targetCohortId={targetCohortId}
          enableTags={enableTags}
          successToast={successToast}
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
  targetCohortId,
  enableTags,
  successToast,
  close,
}: {
  data: CSVData;
  roles: ImportRoles;
  locationId: string;
  countries: { code: string; name: string }[];
  targetCohortId?: string;
  enableTags?: boolean;
  successToast: (count: number) => string;
  close: () => void;
}) {
  const [step, setStep] = useState<Step>("mapping");
  const [previewModel, setPreviewModel] = useState<PreviewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [raceBanner, setRaceBanner] = useState<string | null>(null);

  // Default column-mapping suggestions inferred from header text.
  // Uses normalize + synonym table so common variants ("Tussenvoegsel"
  // vs "Tussenvoegsels", English headers like "Email", DOB shorthand)
  // resolve to the right target without operator intervention.
  const defaultMapping: Record<string, string> = {};
  data.labels?.forEach((item, index) => {
    defaultMapping[`include-column-${index}`] =
      guessColumn(item?.label ?? "", { enableTags }) ?? SELECT_LABEL;
  });

  const previewBound = previewBulkImportAction.bind(
    null,
    locationId,
    roles,
    data,
    countries,
    targetCohortId,
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
        | {
            kind: "committed";
            createdPersonIds: string[];
            linkedPersonIds: string[];
          }
        | {
            kind: "preview_invalidated";
            attempt: 2 | 3;
            updatedMatches: PreviewMatches;
          }
        | { kind: "preview_invalidated_max"; message: string };

      if (r.kind === "committed") {
        const total = r.createdPersonIds.length + r.linkedPersonIds.length;
        toast.success(successToast(total));
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
    onError: ({ error }) => {
      setCommitting(false);
      // Surface the real server-side message during development (and any
      // validation issues from next-safe-action) instead of swallowing
      // them under the generic fallback. Production users still see the
      // friendly fallback if no message is available.
      const serverMsg = error.serverError;
      const validationMsg = error.validationErrors
        ? JSON.stringify(error.validationErrors)
        : undefined;
      setErrorMessage(
        serverMsg ?? validationMsg ?? DEFAULT_SERVER_ERROR_MESSAGE,
      );
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
        targetCohortId={targetCohortId}
        roles={roles}
      >
        <DialogBody>
          {raceBanner ? (
            <ErrorMessage className="mb-4">{raceBanner}</ErrorMessage>
          ) : null}
          {errorMessage ? (
            <ErrorMessage className="mb-4">{errorMessage}</ErrorMessage>
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
              setErrorMessage(null);
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
                    .map((value, valueIndex) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: example data only, position is the natural identity
                      <Code key={valueIndex}>{String(value)}</Code>
                    ))}
                </TableCell>
                <TableCell>
                  <Select
                    name={`include-column-${index}`}
                    defaultValue={defaultMapping[`include-column-${index}`]}
                    className="min-w-48"
                  >
                    <option value={SELECT_LABEL}>{SELECT_LABEL}</option>
                    {(enableTags
                      ? COLUMN_MAPPING_WITH_TAG
                      : COLUMN_MAPPING
                    ).map((column) => (
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
        tags?: string[];
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
        tags?: string[];
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
        ...(row.tags && row.tags.length > 0 ? { tags: row.tags } : {}),
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

// Header-to-target column matcher. Uses normalized synonym lookup so
// common variants ("E-mail", "tussenvoegsel" vs the plural target,
// "DOB", "Last name") map to the right COLUMN_MAPPING entry without
// the operator having to fix the dropdown manually.
//
// Hoisted to module scope so the regexes / sets are built once.
const COLUMN_SYNONYMS: Record<(typeof COLUMN_MAPPING)[number], string[]> = {
  "E-mailadres": [
    "email",
    "emailadres",
    "e-mail",
    "e-mailadres",
    "mail",
    "mailadres",
  ],
  Voornaam: ["voornaam", "voornamen", "firstname", "first", "given name"],
  Tussenvoegsels: [
    "tussenvoegsel",
    "tussenvoegsels",
    "tussen",
    "middlename",
    "middle",
    "infix",
  ],
  Achternaam: [
    "achternaam",
    "achternamen",
    "lastname",
    "last",
    "surname",
    "familienaam",
    "family name",
  ],
  Geboortedatum: [
    "geboortedatum",
    "dob",
    "birthdate",
    "dateofbirth",
    "date of birth",
    "geboorte datum",
  ],
  Geboorteplaats: [
    "geboorteplaats",
    "birthplace",
    "placeofbirth",
    "place of birth",
    "geboorte plaats",
    "stad",
    "city",
  ],
  Geboorteland: [
    "geboorteland",
    "birthcountry",
    "countryofbirth",
    "country of birth",
    "geboorte land",
    "land",
    "country",
  ],
};

function normalizeHeader(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // strip combining marks (diacritics)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const COLUMN_NORMALIZED_SYNONYMS: Array<{
  target: (typeof COLUMN_MAPPING)[number];
  syns: string[];
}> = COLUMN_MAPPING.map((target) => ({
  target,
  syns: [target, ...(COLUMN_SYNONYMS[target] ?? [])]
    .map(normalizeHeader)
    .filter(Boolean),
}));

function guessColumn(
  header: string,
  options: { enableTags?: boolean } = {},
): (typeof COLUMN_MAPPING_WITH_TAG)[number] | null {
  const h = normalizeHeader(header);
  if (!h) return null;
  // 0. Cohort variant: any header that normalizes to start with "tag"
  //    auto-maps to the Tag column. This preserves the legacy behaviour
  //    where headers like "Tag Groep A", "Tag 1", "tags" all bound to
  //    Tag without operator intervention. Keep this first so it doesn't
  //    fight the substring rules below.
  if (options.enableTags && h.startsWith("tag")) {
    return "Tag";
  }
  // 1. Exact synonym match.
  for (const { target, syns } of COLUMN_NORMALIZED_SYNONYMS) {
    if (syns.includes(h)) return target;
  }
  // 2. Bidirectional substring — handles "tussenvoegsel" vs "tussenvoegsels"
  //    and "geboortedatumlid" vs "geboortedatum" without mis-binding.
  //    Length floor on the shorter side prevents short generic headers like
  //    "naam" from matching "voornaam"/"achternaam" by accident — the loose
  //    synonym list above already covers the standalone short cases.
  const MIN_SUBSTRING_LEN = 6;
  for (const { target, syns } of COLUMN_NORMALIZED_SYNONYMS) {
    if (
      syns.some(
        (s) =>
          (h.includes(s) && s.length >= MIN_SUBSTRING_LEN) ||
          (s.includes(h) && h.length >= MIN_SUBSTRING_LEN),
      )
    ) {
      return target;
    }
  }
  return null;
}
