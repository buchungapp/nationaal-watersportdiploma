import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import * as application from "../application/index.js";

const BUCHUNG_IMPORT_PRIVILEGE = "import-session:buchung";
const BUCHUNG_SOURCE_SYSTEM = "buchung";

type ErrorCode = "bad_request" | "conflict" | "forbidden" | "not_found";

type DomainSessionStatus =
  | "open"
  | "reviewing"
  | "superseded"
  | "invalidated"
  | "cancelled"
  | "committed";

type DomainSessionRecord = {
  id: string;
  locationId: string;
  targetCohortId: string;
  sourceSystem: string;
  externalSessionKey: string;
  generation: number;
  status: DomainSessionStatus;
  rowCount: number;
  createdAt: string;
  updatedAt: string;
};

type DomainValidationMessage = {
  code?: unknown;
  severity?: unknown;
  field?: unknown;
  message?: unknown;
};

type DomainRow = {
  rowIndex: number;
  externalRowKey: string | null;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string;
  dateOfBirth: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  email: string | null;
  tags: string[];
  rawPayload: unknown;
  validationErrors: unknown;
  status: "valid" | "invalid";
};

type FullImportSession = {
  session: DomainSessionRecord;
  rows: DomainRow[];
};

type OperationAuthentication = Partial<application.Authentication>;
type JsonErrorResponse<Status extends number = 400 | 403 | 404 | 409> = {
  readonly status: Status;
  readonly parameters: Record<keyof never, never>;
  readonly contentType: "application/json";
  readonly entity: () => api.types.ErrorModel;
};
type ResolveErrorResponse = JsonErrorResponse<403> | JsonErrorResponse<404>;

function error(code: ErrorCode, message: string): api.types.ErrorModel {
  return {
    code,
    message,
  };
}

function jsonResponse<const Status extends number, Entity>(
  status: Status,
  entity: Entity,
) {
  return {
    status,
    parameters: {},
    contentType: "application/json",
    entity: () => entity,
  } as const;
}

function getAuthenticatedApiKeyId(authentication: OperationAuthentication) {
  return "apiKey" in authentication ? authentication.apiKey?.apiKey : undefined;
}

async function findLocation(locationKey: string) {
  try {
    if (api.validators.isHandle(locationKey)) {
      return await core.Location.fromHandle(locationKey);
    }
    if (api.validators.isId(locationKey)) {
      return await core.Location.fromId(locationKey);
    }
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message === "Expected 1 row, got 0"
    ) {
      return null;
    }
    throw error;
  }

  return null;
}

async function findCohort(locationId: string, cohortKey: string) {
  const cohort = api.validators.isHandle(cohortKey)
    ? await core.Cohort.byIdOrHandle({ handle: cohortKey, locationId })
    : api.validators.isId(cohortKey)
      ? await core.Cohort.byIdOrHandle({ id: cohortKey })
      : null;

  if (!cohort || cohort.locationId !== locationId) {
    return null;
  }

  return cohort;
}

async function hasBuchungImportAccess(
  authentication: OperationAuthentication,
  locationId: string,
) {
  return application.userBoundApiKeyHasPrivilegeForLocation(authentication, {
    privilegeHandle: BUCHUNG_IMPORT_PRIVILEGE,
    locationId,
  });
}

async function resolveLocationAndAuthorize(
  authentication: OperationAuthentication,
  input: {
    locationKey: string;
  },
): Promise<
  | { ok: true; location: Awaited<ReturnType<typeof core.Location.fromHandle>> }
  | { ok: false; response: ResolveErrorResponse }
> {
  const location = await findLocation(input.locationKey);
  if (!location) {
    return {
      ok: false,
      response: jsonResponse(404, error("not_found", "Location not found.")),
    };
  }

  if (!(await hasBuchungImportAccess(authentication, location.id))) {
    return {
      ok: false,
      response: jsonResponse(
        403,
        error("forbidden", "Missing Buchung import privilege for location."),
      ),
    };
  }

  return { ok: true, location };
}

async function resolveLocationCohortAndAuthorize(
  authentication: OperationAuthentication,
  input: {
    locationKey: string;
    cohortKey: string;
  },
): Promise<
  | {
      ok: true;
      location: Awaited<ReturnType<typeof core.Location.fromHandle>>;
      cohort: NonNullable<Awaited<ReturnType<typeof core.Cohort.byIdOrHandle>>>;
    }
  | { ok: false; response: ResolveErrorResponse }
> {
  const resolved = await resolveLocationAndAuthorize(authentication, input);
  if (!resolved.ok) {
    return resolved;
  }

  const cohort = await findCohort(resolved.location.id, input.cohortKey);
  if (!cohort) {
    return {
      ok: false,
      response: jsonResponse(404, error("not_found", "Cohort not found.")),
    };
  }

  return { ok: true, location: resolved.location, cohort };
}

function mapStatus(status: DomainSessionStatus): api.types.ImportSessionStatus {
  switch (status) {
    case "open":
      return "received";
    case "reviewing":
    case "superseded":
    case "cancelled":
    case "committed":
      return status;
    case "invalidated":
      return "superseded";
  }
}

function normalizeMessages(
  validationErrors: unknown,
): api.types.ImportSessionRowValidationMessageModel[] {
  if (!Array.isArray(validationErrors)) {
    return [];
  }

  return validationErrors.map((message: DomainValidationMessage) => {
    const normalized: api.types.ImportSessionRowValidationMessageModel = {
      code: typeof message.code === "string" ? message.code : "validation",
      severity:
        message.severity === "warning" || message.severity === "info"
          ? message.severity
          : "error",
      message:
        typeof message.message === "string"
          ? message.message
          : "Import row validation failed",
    };

    if (typeof message.field === "string" || message.field === null) {
      normalized.field = message.field;
    }

    return normalized;
  });
}

function rowValidation(
  row: DomainRow,
): api.types.ImportSessionRowValidationModel {
  const messages = normalizeMessages(row.validationErrors);
  const hasWarning = messages.some((message) => message.severity === "warning");

  return {
    status:
      row.status === "invalid" ? "invalid" : hasWarning ? "warning" : "valid",
    messages,
  };
}

function mapRow(row: DomainRow): api.types.ImportSessionRowModel {
  const mapped: api.types.ImportSessionRowModel = {
    rowIndex: row.rowIndex,
    externalRowKey: row.externalRowKey ?? String(row.rowIndex),
    firstName: row.firstName || null,
    lastNamePrefix: row.lastNamePrefix,
    lastName: row.lastName || null,
    dateOfBirth: row.dateOfBirth,
    birthCity: row.birthCity,
    birthCountry: row.birthCountry,
    email: row.email,
    tags: row.tags,
    validation: rowValidation(row),
  };

  if (
    row.rawPayload === null ||
    (typeof row.rawPayload === "object" &&
      row.rawPayload !== undefined &&
      !Array.isArray(row.rawPayload))
  ) {
    mapped.rawMetadata = row.rawPayload as api.types.RawMetadata;
  }

  return mapped;
}

function validationSummary(rows: DomainRow[]) {
  const rowStatuses = rows.map((row) => rowValidation(row).status);

  return {
    validRowCount: rowStatuses.filter((status) => status === "valid").length,
    warningRowCount: rowStatuses.filter((status) => status === "warning")
      .length,
    invalidRowCount: rowStatuses.filter((status) => status === "invalid")
      .length,
  };
}

async function getFullSession(sessionId: string) {
  const full = await core.ImportSession.get({ importSessionId: sessionId });
  return full as FullImportSession | null;
}

async function mapSession(
  session: DomainSessionRecord,
  input: {
    locationKey: string;
    cohortKey?: string;
    includeRows: false;
  },
): Promise<api.types.ImportSessionListModel>;
async function mapSession(
  session: DomainSessionRecord,
  input: {
    locationKey: string;
    cohortKey?: string;
    includeRows: true;
  },
): Promise<api.types.ImportSessionModel>;
async function mapSession(
  session: DomainSessionRecord,
  input: {
    locationKey: string;
    cohortKey?: string;
    includeRows: boolean;
  },
) {
  const full = await getFullSession(session.id);
  const rows = full?.rows ?? [];

  const base: api.types.ImportSessionListModel = {
    externalSessionKey: session.externalSessionKey,
    locationKey: input.locationKey,
    cohortKey: input.cohortKey ?? session.targetCohortId,
    status: mapStatus(session.status),
    rowCount: session.rowCount,
    validationSummary: validationSummary(rows),
    receivedAt: session.createdAt,
    updatedAt: session.updatedAt,
  };

  if (!input.includeRows) {
    return base;
  }

  return {
    ...base,
    source: {
      vendor: BUCHUNG_SOURCE_SYSTEM,
    },
    rows: rows.map(mapRow),
  } satisfies api.types.ImportSessionModel;
}

async function findSessionForLocation(input: {
  locationId: string;
  externalSessionKey: string;
}) {
  const sessions = (await core.ImportSession.list({
    locationId: input.locationId,
    sourceSystem: BUCHUNG_SOURCE_SYSTEM,
  })) as DomainSessionRecord[];

  return sessions.filter(
    (session) => session.externalSessionKey === input.externalSessionKey,
  );
}

function mapRequestRows(
  rows: api.types.UpsertImportSessionRowModel[],
): Parameters<typeof core.ImportSession.upsertFullSnapshot>[0]["rows"] {
  return rows.map((row) => ({
    rowIndex: row.rowIndex,
    externalRowKey: row.externalRowKey,
    firstName: row.firstName,
    lastNamePrefix: row.lastNamePrefix,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    birthCity: row.birthCity,
    birthCountry: row.birthCountry,
    email: row.email,
    tags: row.tags ?? [],
    rawPayload: row.rawMetadata,
  }));
}

export const listLocationCohortImportSessions: api.server.ListLocationCohortImportSessionsOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { locationKey, cohortKey } = incomingRequest.parameters;
  const resolved = await resolveLocationCohortAndAuthorize(authentication, {
    locationKey,
    cohortKey,
  });
  if (!resolved.ok) return resolved.response;

  const sessions = (await core.ImportSession.list({
    locationId: resolved.location.id,
    targetCohortId: resolved.cohort.id,
    sourceSystem: BUCHUNG_SOURCE_SYSTEM,
  })) as DomainSessionRecord[];

  const entity = await Promise.all(
    sessions.map((session) =>
      mapSession(session, {
        locationKey: resolved.location.handle,
        cohortKey: resolved.cohort.handle,
        includeRows: false,
      }),
    ),
  );

  return jsonResponse(200, entity);
};

export const upsertLocationCohortImportSession: api.server.UpsertLocationCohortImportSessionOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { locationKey, cohortKey, externalSessionKey } =
    incomingRequest.parameters;
  const requestEntity = await incomingRequest.entity();

  const resolved = await resolveLocationCohortAndAuthorize(authentication, {
    locationKey,
    cohortKey,
  });
  if (!resolved.ok) return resolved.response;

  if (
    requestEntity.source.vendor.trim().toLowerCase() !== BUCHUNG_SOURCE_SYSTEM
  ) {
    return jsonResponse(
      400,
      error(
        "bad_request",
        "source.vendor must be buchung for this import credential.",
      ),
    );
  }

  const existingSessions = await findSessionForLocation({
    locationId: resolved.location.id,
    externalSessionKey,
  });
  const existingForCohort = existingSessions
    .filter((session) => session.targetCohortId === resolved.cohort.id)
    .toSorted((a, b) => b.generation - a.generation)[0];

  if (
    existingSessions.some(
      (session) => session.targetCohortId !== resolved.cohort.id,
    )
  ) {
    return jsonResponse(
      409,
      error(
        "conflict",
        "Import session key already exists for a different cohort in this location.",
      ),
    );
  }

  const result = await core.ImportSession.upsertFullSnapshot({
    locationId: resolved.location.id,
    targetCohortId: resolved.cohort.id,
    sourceSystem: BUCHUNG_SOURCE_SYSTEM,
    externalSessionKey,
    receivedByTokenId: getAuthenticatedApiKeyId(authentication),
    rows: mapRequestRows(requestEntity.rows),
  });

  const full = await getFullSession(result.id);
  if (!full) {
    return jsonResponse(404, error("not_found", "Import session not found."));
  }

  const entity = await mapSession(full.session, {
    locationKey: resolved.location.handle,
    cohortKey: resolved.cohort.handle,
    includeRows: true,
  });

  if (
    existingForCohort &&
    ["open", "reviewing"].includes(existingForCohort.status)
  ) {
    return jsonResponse(200, entity);
  }

  return jsonResponse(201, entity);
};

export const retrieveLocationImportSession: api.server.RetrieveLocationImportSessionOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { locationKey, externalSessionKey } = incomingRequest.parameters;
  const resolved = await resolveLocationAndAuthorize(authentication, {
    locationKey,
  });
  if (!resolved.ok) return resolved.response;

  const sessions = await findSessionForLocation({
    locationId: resolved.location.id,
    externalSessionKey,
  });

  if (sessions.length === 0) {
    return jsonResponse(404, error("not_found", "Import session not found."));
  }

  const cohortIds = new Set(sessions.map((session) => session.targetCohortId));
  if (cohortIds.size > 1) {
    return jsonResponse(
      404,
      error("not_found", "Import session key is ambiguous in this location."),
    );
  }

  const session = sessions.toSorted((a, b) => b.generation - a.generation)[0];
  if (!session) {
    return jsonResponse(404, error("not_found", "Import session not found."));
  }
  const cohort = await core.Cohort.byIdOrHandle({ id: session.targetCohortId });
  if (!cohort || cohort.locationId !== resolved.location.id) {
    return jsonResponse(404, error("not_found", "Import session not found."));
  }

  const entity = await mapSession(session, {
    locationKey: resolved.location.handle,
    cohortKey: cohort.handle,
    includeRows: true,
  });

  return jsonResponse(200, entity);
};
