"use client";

import { useAction } from "next-safe-action/hooks";
import { use, useState } from "react";
import { toast } from "sonner";
import { materializeImportSessionPreviewAction } from "~/app/_actions/import-session/import-session-actions";
import { commitBulkImportAction } from "~/app/_actions/person/bulk-import-actions";
import Spinner from "~/app/_components/spinner";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { ErrorMessage } from "~/app/(dashboard)/_components/fieldset";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Text } from "~/app/(dashboard)/_components/text";
import {
  assertPreviewContext,
  BulkImportPreviewContext,
} from "~/app/(dashboard)/(management)/locatie/[location]/personen/_components/import-preview/context";
import { PreviewStep } from "~/app/(dashboard)/(management)/locatie/[location]/personen/_components/import-preview/PreviewStep";
import { BulkImportPreviewProvider } from "~/app/(dashboard)/(management)/locatie/[location]/personen/_components/import-preview/provider";
import type {
  PreviewMatches,
  PreviewModel,
  RowDecision,
} from "~/app/(dashboard)/(management)/locatie/[location]/personen/_components/import-preview/types";
import dayjs from "~/lib/dayjs";

type ImportSessionListItem = {
  id: string;
  externalSessionKey: string;
  generation: number;
  revision: number;
  status:
    | "open"
    | "reviewing"
    | "superseded"
    | "invalidated"
    | "cancelled"
    | "committed";
  rowCount: number;
  createdAt: string;
  updatedAt: string;
};

const roles = ["student"] as const;

export function ImportSessionsReview({
  sessions,
  locationId,
  cohortId,
  locationHandle,
  cohortHandle,
}: {
  sessions: ImportSessionListItem[];
  locationId: string;
  cohortId: string;
  locationHandle: string;
  cohortHandle: string;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [previewModel, setPreviewModel] = useState<PreviewModel | null>(null);
  const [materializeError, setMaterializeError] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  const materialize = useAction(materializeImportSessionPreviewAction, {
    onSuccess: ({ data }) => {
      if (!data) {
        setMaterializeError("Preview kon niet worden aangemaakt.");
        return;
      }
      setPreviewModel({
        previewToken: data.previewToken,
        attempt: data.attempt as 1 | 2 | 3,
        parsedRows: (data.candidates as PreviewModel["parsedRows"]).map(
          (row) => ({
            ...row,
            dateOfBirth: new Date(row.dateOfBirth),
            tags: row.tags ?? [],
          }),
        ),
        parseErrors: data.parseErrors.map((error) => ({
          ...error,
          values: [],
        })),
        matches: data.matches as PreviewMatches,
      });
      setMaterializeError(null);
      setCommitError(null);
    },
    onError: ({ error }) => {
      setMaterializeError(
        error.serverError ?? "Preview kon niet worden aangemaakt.",
      );
    },
  });

  const commit = useAction(commitBulkImportAction, {
    onSuccess: ({ data }) => {
      setCommitting(false);
      if (!data) {
        setCommitError("Import kon niet worden verwerkt.");
        return;
      }

      const result = data as
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

      if (result.kind === "committed") {
        toast.success("Importsessie verwerkt.");
        setPreviewModel(null);
        setSelectedSessionId(null);
        setCommitError(null);
        return;
      }

      if (result.kind === "preview_invalidated") {
        if (previewModel) {
          setPreviewModel({
            ...previewModel,
            attempt: result.attempt,
            matches: result.updatedMatches,
          });
        }
        setCommitError("Roster veranderde tijdens je review.");
        return;
      }

      setCommitError(result.message);
    },
    onError: ({ error }) => {
      setCommitting(false);
      setCommitError(error.serverError ?? "Import kon niet worden verwerkt.");
    },
  });

  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );

  return (
    <div className="space-y-6">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Sessie</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Rijen</TableHeader>
            <TableHeader>Ontvangen</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <div className="font-medium text-zinc-950 dark:text-white">
                  {session.externalSessionKey}
                </div>
                <Text className="!text-xs">
                  Generatie {session.generation}, revisie {session.revision}
                </Text>
              </TableCell>
              <TableCell>
                <StatusBadge status={session.status} />
              </TableCell>
              <TableCell>{session.rowCount}</TableCell>
              <TableCell>
                {dayjs(session.createdAt).tz().format("DD-MM-YYYY HH:mm")}
              </TableCell>
              <TableCell className="text-right">
                {session.status === "open" || session.status === "reviewing" ? (
                  <Button
                    outline
                    disabled={
                      materialize.status === "executing" &&
                      selectedSessionId === session.id
                    }
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setPreviewModel(null);
                      setMaterializeError(null);
                      materialize.execute({
                        importSessionId: session.id,
                        locationHandle,
                        cohortHandle,
                      });
                    }}
                  >
                    {materialize.status === "executing" &&
                    selectedSessionId === session.id ? (
                      <Spinner size="sm" />
                    ) : null}
                    Review
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {materializeError ? (
        <ErrorMessage>{materializeError}</ErrorMessage>
      ) : null}

      {selectedSession && previewModel ? (
        <BulkImportPreviewProvider
          initialPreview={previewModel}
          locationId={locationId}
          targetCohortId={cohortId}
          roles={[...roles]}
        >
          <div className="space-y-3 rounded-lg border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
            {commitError ? (
              <ErrorMessage className="mb-4">{commitError}</ErrorMessage>
            ) : null}
            <CommitImportSessionPreview
              previewModel={previewModel}
              locationId={locationId}
              committing={committing}
              onCancel={() => {
                setPreviewModel(null);
                setSelectedSessionId(null);
                setCommitError(null);
              }}
              onCommit={(payload) => {
                setCommitting(true);
                setCommitError(null);
                commit.execute(payload);
              }}
            />
          </div>
        </BulkImportPreviewProvider>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: ImportSessionListItem["status"] }) {
  const color =
    status === "open"
      ? "blue"
      : status === "reviewing"
        ? "yellow"
        : status === "committed"
          ? "green"
          : status === "cancelled"
            ? "red"
            : "zinc";

  const label =
    status === "open"
      ? "Ontvangen"
      : status === "reviewing"
        ? "In review"
        : status === "committed"
          ? "Verwerkt"
          : status === "cancelled"
            ? "Geannuleerd"
            : "Vervangen";

  return <Badge color={color}>{label}</Badge>;
}

function CommitImportSessionPreview({
  previewModel,
  locationId,
  committing,
  onCancel,
  onCommit,
}: {
  previewModel: PreviewModel;
  locationId: string;
  committing: boolean;
  onCancel: () => void;
  onCommit: (payload: {
    previewToken: string;
    locationId: string;
    roles: ["student"];
    decisions: Record<string, RowDecision>;
    candidateInputsByRowIndex: Record<
      string,
      {
        email: string | null;
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

  return (
    <PreviewStep
      submitting={committing}
      onCancel={onCancel}
      onSubmit={() => {
        const decisions: Record<string, RowDecision> = {};
        for (const [rowIndex, decision] of ctx.state.decisions) {
          decisions[String(rowIndex)] = decision;
        }

        const candidateInputsByRowIndex: Record<
          string,
          {
            email: string | null;
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
            ...(row.tags.length > 0 ? { tags: row.tags } : {}),
          };
        }

        onCommit({
          previewToken: previewModel.previewToken,
          locationId,
          roles: ["student"],
          decisions,
          candidateInputsByRowIndex,
        });
      }}
    />
  );
}
