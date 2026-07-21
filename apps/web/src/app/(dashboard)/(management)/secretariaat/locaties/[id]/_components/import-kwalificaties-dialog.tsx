"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import {
  commitBulkImportKwalificatiesAction,
  previewBulkImportKwalificatiesAction,
} from "~/app/_actions/kss/bulk-import-kwalificaties-action";
import { KWALIFICATIE_COLUMN_MAPPING } from "~/app/_actions/kss/kwalificatie-bulk-import-constants";
import {
  type CSVData,
  SELECT_LABEL,
} from "~/app/_actions/person/person-bulk-csv-mappings";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
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
import { Code, Text } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { invariant } from "~/utils/invariant";

type PreviewResult = {
  previewToken: string;
  results: Array<
    | {
        rowIndex: number;
        status: "ready";
        personName: string;
        courseTitle: string;
        kwalificatieLabel: string;
        kerntaakOnderdeelCount: number;
        toSkip: number;
      }
    | { rowIndex: number; status: "error"; error: string }
  >;
  summary: {
    ready: number;
    errors: number;
    totalKwalificatiesToAdd: number;
    totalKwalificatiesToSkip: number;
  };
  parseErrors: Array<{ rowIndex: number; error: string }>;
};

export function ImportKwalificatiesDialog({
  locationId,
  isOpen,
  setIsOpen,
}: {
  locationId: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const [forceRerenderId, setForceRerenderId] = useState(0);

  return (
    <ImportKwalificatiesDialogInner
      key={String(forceRerenderId)}
      locationId={locationId}
      isOpen={isOpen}
      setIsOpen={(next) => {
        setIsOpen(next);
        if (!next) setForceRerenderId((n) => n + 1);
      }}
    />
  );
}

function ImportKwalificatiesDialogInner({
  locationId,
  isOpen,
  setIsOpen,
}: {
  locationId: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"paste" | "mapping" | "preview">("paste");
  const [data, setData] = useState<CSVData>({ labels: null, rows: null });
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewBound = previewBulkImportKwalificatiesAction.bind(
    null,
    locationId,
    data,
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
      if (result.kind === "parse_errors") {
        setErrorMessage(
          result.parseErrors
            .map((e) => `Rij ${e.rowIndex}: ${e.error}`)
            .join("\n"),
        );
        return;
      }
      if (result.kind === "previewed") {
        setPreview({
          previewToken: result.previewToken,
          results: result.results as PreviewResult["results"],
          summary: result.summary,
          parseErrors: result.parseErrors,
        });
        setStep("preview");
        setErrorMessage(null);
      }
    },
    onError: ({ error }) => {
      setErrorMessage(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  const commitExec = useAction(commitBulkImportKwalificatiesAction, {
    onSuccess: ({ data: result }) => {
      if (!result) {
        setErrorMessage(DEFAULT_SERVER_ERROR_MESSAGE);
        return;
      }
      toast.success(
        `${result.added} kwalificatie${result.added === 1 ? "" : "s"} toegevoegd` +
          (result.skipped > 0 ? `, ${result.skipped} overgeslagen` : ""),
      );
      router.refresh();
      setIsOpen(false);
    },
    onError: ({ error }) => {
      setErrorMessage(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  const handlePasteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = formData.get("data") as string;

    const splitRows = raw
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t"));

    const headers = splitRows[0];
    invariant(headers, "Data moet minimaal één rij bevatten.");
    splitRows.shift();

    const labels = headers.map((header, item) => ({
      label: header,
      value: splitRows.slice(0, 2).map((row) => row[item]),
    }));

    setData({ labels, rows: splitRows });
    setStep("mapping");
  };

  const defaultMapping: Record<string, string> = {};
  data.labels?.forEach((item, index) => {
    const header = item.label.toLowerCase();
    const match = KWALIFICATIE_COLUMN_MAPPING.find((col) =>
      header.includes(col.toLowerCase().replace("-", "")),
    );
    defaultMapping[`include-column-${index}`] = match ?? SELECT_LABEL;
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

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} size="5xl">
      <DialogTitle>Kwalificaties importeren (bulk)</DialogTitle>

      {step === "paste" ? (
        <form onSubmit={handlePasteSubmit}>
          <DialogBody>
            <Fieldset>
              <Legend>Data</Legend>
            </Fieldset>
            <Text className="mt-2">
              Plak tab-gescheiden data met kolommen: E-mailadres of NWD-id,
              Cursus, Richting (instructeur/leercoach/pvb_beoordelaar), Niveau
              (1-5), optioneel Kerntaak en Opmerkingen.
            </Text>
            <Textarea
              className="mt-4"
              name="data"
              rows={10}
              placeholder={
                "E-mail\tCursus\tRichting\tNiveau\nvoorbeeld@mail.nl\tKielboot Volwassenen\tinstructeur\t3"
              }
            />
          </DialogBody>
          <DialogActions>
            <Button plain type="button" onClick={() => setIsOpen(false)}>
              Sluiten
            </Button>
            <Button color="branding-dark" type="submit">
              Verder
            </Button>
          </DialogActions>
        </form>
      ) : null}

      {step === "mapping" ? (
        <form onSubmit={onMappingSubmit}>
          <DialogDescription>
            Koppel de kolommen aan de juiste velden.
          </DialogDescription>
          <DialogBody>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Kolom</TableHeader>
                  <TableHeader>Voorbeeld</TableHeader>
                  <TableHeader>Doel</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.labels?.map((item, index) => (
                  <TableRow key={item.label}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell className="space-x-2">
                      {item.value
                        .filter((val) => !!val)
                        .map((value, valueIndex) => (
                          <Code key={`${item.label}-${valueIndex}`}>
                            {String(value)}
                          </Code>
                        ))}
                    </TableCell>
                    <TableCell>
                      <Select
                        name={`include-column-${index}`}
                        defaultValue={defaultMapping[`include-column-${index}`]}
                        className="min-w-48"
                      >
                        <option value={SELECT_LABEL}>{SELECT_LABEL}</option>
                        {KWALIFICATIE_COLUMN_MAPPING.map((column) => (
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
            <Button plain type="button" onClick={() => setStep("paste")}>
              Terug
            </Button>
            <Button
              color="branding-dark"
              type="submit"
              disabled={previewExec.status === "executing"}
            >
              {previewExec.status === "executing" ? (
                <Spinner className="text-white" />
              ) : null}
              Preview
            </Button>
          </DialogActions>
        </form>
      ) : null}

      {step === "preview" && preview ? (
        <>
          <DialogBody>
            <Text>
              {preview.summary.ready} rij(en) klaar, {preview.summary.errors}{" "}
              fout(en)
              {preview.parseErrors.length > 0
                ? `, ${preview.parseErrors.length} rij(en) niet gelezen`
                : ""}
              . {preview.summary.totalKwalificatiesToAdd} kwalificatie(s) worden
              toegevoegd, {preview.summary.totalKwalificatiesToSkip} bestaan al.
            </Text>
            <Table className="mt-4">
              <TableHead>
                <TableRow>
                  <TableHeader>Rij</TableHeader>
                  <TableHeader>Persoon</TableHeader>
                  <TableHeader>Cursus</TableHeader>
                  <TableHeader>Kwalificatie</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ...preview.results,
                  ...preview.parseErrors.map((e) => ({
                    rowIndex: e.rowIndex,
                    status: "parse_error" as const,
                    error: e.error,
                  })),
                ]
                  .sort((a, b) => a.rowIndex - b.rowIndex)
                  .map((row) => (
                    <TableRow key={row.rowIndex}>
                      <TableCell>{row.rowIndex}</TableCell>
                      <TableCell>
                        {row.status === "ready" ? row.personName : "—"}
                      </TableCell>
                      <TableCell>
                        {row.status === "ready" ? row.courseTitle : "—"}
                      </TableCell>
                      <TableCell>
                        {row.status === "ready" ? row.kwalificatieLabel : "—"}
                      </TableCell>
                      <TableCell>
                        {row.status === "ready" ? (
                          <span className="text-green-700">
                            +{row.kerntaakOnderdeelCount}
                            {row.toSkip > 0
                              ? ` (${row.toSkip} overgeslagen)`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-red-600">{row.error}</span>
                        )}
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
            <Button plain onClick={() => setStep("mapping")}>
              Terug
            </Button>
            <Button
              color="branding-dark"
              disabled={
                commitExec.status === "executing" ||
                preview.summary.totalKwalificatiesToAdd === 0
              }
              onClick={() => {
                commitExec.execute({
                  previewToken: preview.previewToken,
                  locationId,
                  defaultOpmerkingen: "Geïmporteerd via secretariaat",
                });
              }}
            >
              {commitExec.status === "executing" ? (
                <Spinner className="text-white" />
              ) : null}
              Importeren
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  );
}
