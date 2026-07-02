import {
  ApiKey,
  Cohort,
  ImportSession,
  Location,
  withDatabase,
} from "@nawadi/core";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BUCHUNG_IMPORT_PRIVILEGE = "import-session:buchung";
const BUCHUNG_SOURCE_SYSTEM = "buchung";

const uuidSchema = z.string().uuid();
const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .regex(/^[a-z0-9-]+$/);
const pathKeySchema = z.union([uuidSchema, handleSchema]);
const externalSessionKeySchema = z.string().trim().min(1).max(255);
const rawMetadataSchema = z.record(z.unknown()).nullable();

const importSessionSourceSchema = z
  .object({
    vendor: z.string().trim().min(1),
    exportedAt: z.string().datetime().optional(),
    metadata: rawMetadataSchema.optional(),
  })
  .passthrough();

const upsertImportSessionRowSchema = z
  .object({
    externalRowKey: z.string().trim().min(1).max(255),
    rowIndex: z.number().int().nonnegative(),
    firstName: z.string().nullable().optional(),
    lastNamePrefix: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    dateOfBirth: z.string().date().nullable().optional(),
    birthCity: z.string().nullable().optional(),
    birthCountry: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    tags: z.array(z.string()).optional(),
    rawMetadata: rawMetadataSchema.optional(),
  })
  .passthrough();

const upsertImportSessionSchema = z.object({
  source: importSessionSourceSchema,
  rows: z.array(upsertImportSessionRowSchema),
});

type ErrorCode =
  | "bad_request"
  | "conflict"
  | "forbidden"
  | "internal_error"
  | "not_found"
  | "unauthorized";

type ImportSessionStatus =
  | "received"
  | "reviewing"
  | "superseded"
  | "cancelled"
  | "committed";

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

type ImportSessionRowValidationMessageModel = {
  code: string;
  severity: "error" | "warning" | "info";
  field?: string | null;
  message: string;
};

type ImportSessionRowValidationModel = {
  status: "valid" | "warning" | "invalid";
  messages: ImportSessionRowValidationMessageModel[];
};

type ImportSessionListModel = {
  externalSessionKey: string;
  locationKey: string;
  cohortKey: string;
  status: ImportSessionStatus;
  rowCount: number;
  validationSummary: {
    validRowCount: number;
    warningRowCount: number;
    invalidRowCount: number;
  };
  receivedAt: string;
  updatedAt: string;
};

type ImportSessionModel = ImportSessionListModel & {
  source: {
    vendor: string;
  };
  rows: ImportSessionRowModel[];
};

type ImportSessionRowModel = {
  rowIndex: number;
  externalRowKey: string;
  firstName: string | null;
  lastNamePrefix: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  email: string | null;
  tags: string[];
  rawMetadata?: Record<string, unknown> | null;
  validation: ImportSessionRowValidationModel;
};

type AuthenticatedApiKey = {
  id: string;
  userId: string;
};

export async function listLocationCohortImportSessions(
  request: NextRequest,
  params: {
    locationKey: string;
    cohortKey: string;
  },
) {
  return runImportSessionRoute(request, async (requestId) => {
    const parsedParams = z
      .object({
        locationKey: pathKeySchema,
        cohortKey: pathKeySchema,
      })
      .parse(params);
    const authentication = await authenticateApiKey(request, requestId);
    if (!authentication.ok) return authentication.response;

    const resolved = await resolveLocationCohortAndAuthorize(
      authentication.apiKey,
      parsedParams,
      requestId,
    );
    if (!resolved.ok) return resolved.response;

    const sessions = (await ImportSession.list({
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

    return NextResponse.json(entity);
  });
}

export async function upsertLocationCohortImportSession(
  request: NextRequest,
  params: {
    locationKey: string;
    cohortKey: string;
    externalSessionKey: string;
  },
) {
  return runImportSessionRoute(request, async (requestId) => {
    const parsedParams = z
      .object({
        locationKey: pathKeySchema,
        cohortKey: pathKeySchema,
        externalSessionKey: externalSessionKeySchema,
      })
      .parse(params);
    const authentication = await authenticateApiKey(request, requestId);
    if (!authentication.ok) return authentication.response;

    const resolved = await resolveLocationCohortAndAuthorize(
      authentication.apiKey,
      parsedParams,
      requestId,
    );
    if (!resolved.ok) return resolved.response;

    const requestEntity = upsertImportSessionSchema.parse(await request.json());
    if (
      requestEntity.source.vendor.trim().toLowerCase() !== BUCHUNG_SOURCE_SYSTEM
    ) {
      return jsonError(
        400,
        "bad_request",
        "source.vendor must be buchung for this import credential.",
        requestId,
      );
    }

    const existingSessions = await findSessionForLocation({
      locationId: resolved.location.id,
      externalSessionKey: parsedParams.externalSessionKey,
    });
    const existingForCohort = existingSessions
      .filter((session) => session.targetCohortId === resolved.cohort.id)
      .toSorted((a, b) => b.generation - a.generation)[0];

    if (
      existingSessions.some(
        (session) => session.targetCohortId !== resolved.cohort.id,
      )
    ) {
      return jsonError(
        409,
        "conflict",
        "Import session key already exists for a different cohort in this location.",
        requestId,
      );
    }

    const result = await ImportSession.upsertFullSnapshot({
      locationId: resolved.location.id,
      targetCohortId: resolved.cohort.id,
      sourceSystem: BUCHUNG_SOURCE_SYSTEM,
      externalSessionKey: parsedParams.externalSessionKey,
      receivedByTokenId: authentication.apiKey.id,
      rows: requestEntity.rows.map((row) => ({
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
      })),
    });

    const full = await getFullSession(result.id);
    if (!full) {
      return jsonError(
        404,
        "not_found",
        "Import session not found.",
        requestId,
      );
    }

    const entity = await mapSession(full.session, {
      locationKey: resolved.location.handle,
      cohortKey: resolved.cohort.handle,
      includeRows: true,
    });
    const status =
      existingForCohort &&
      ["open", "reviewing"].includes(existingForCohort.status)
        ? 200
        : 201;

    return NextResponse.json(entity, { status });
  });
}

export async function retrieveLocationImportSession(
  request: NextRequest,
  params: {
    locationKey: string;
    externalSessionKey: string;
  },
) {
  return runImportSessionRoute(request, async (requestId) => {
    const parsedParams = z
      .object({
        locationKey: pathKeySchema,
        externalSessionKey: externalSessionKeySchema,
      })
      .parse(params);
    const authentication = await authenticateApiKey(request, requestId);
    if (!authentication.ok) return authentication.response;

    const resolved = await resolveLocationAndAuthorize(
      authentication.apiKey,
      { locationKey: parsedParams.locationKey },
      requestId,
    );
    if (!resolved.ok) return resolved.response;

    const sessions = await findSessionForLocation({
      locationId: resolved.location.id,
      externalSessionKey: parsedParams.externalSessionKey,
    });

    if (sessions.length === 0) {
      return jsonError(
        404,
        "not_found",
        "Import session not found.",
        requestId,
      );
    }

    const cohortIds = new Set(
      sessions.map((session) => session.targetCohortId),
    );
    if (cohortIds.size > 1) {
      return jsonError(
        404,
        "not_found",
        "Import session key is ambiguous in this location.",
        requestId,
      );
    }

    const session = sessions.toSorted((a, b) => b.generation - a.generation)[0];
    if (!session) {
      return jsonError(
        404,
        "not_found",
        "Import session not found.",
        requestId,
      );
    }

    const cohort = await Cohort.byIdOrHandle({ id: session.targetCohortId });
    if (!cohort || cohort.locationId !== resolved.location.id) {
      return jsonError(
        404,
        "not_found",
        "Import session not found.",
        requestId,
      );
    }

    const entity = await mapSession(session, {
      locationKey: resolved.location.handle,
      cohortKey: cohort.handle,
      includeRows: true,
    });

    return NextResponse.json(entity);
  });
}

async function runImportSessionRoute(
  request: NextRequest,
  handler: (requestId: string | null) => Promise<NextResponse>,
) {
  const requestId = normalizedHeader(request.headers.get("x-request-id"));
  const pgUri = process.env.PGURI;

  if (!pgUri) {
    return jsonError(
      500,
      "internal_error",
      "PGURI not configured on server.",
      requestId,
    );
  }

  try {
    return await withDatabase(pgUri, () => handler(requestId));
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return jsonError(
        400,
        "bad_request",
        "Invalid import-session request.",
        requestId,
        {
          issues:
            error instanceof z.ZodError
              ? error.issues.map((issue) => ({
                  path: issue.path.join("."),
                  message: issue.message,
                }))
              : undefined,
        },
      );
    }

    console.error("Import-session route failed", error);
    return jsonError(
      500,
      "internal_error",
      "Import-session request failed.",
      requestId,
    );
  }
}

async function authenticateApiKey(
  request: NextRequest,
  requestId: string | null,
): Promise<
  | { ok: true; apiKey: AuthenticatedApiKey }
  | { ok: false; response: NextResponse }
> {
  const token = readApiKeyToken(request);
  if (!token) {
    return {
      ok: false,
      response: jsonError(401, "unauthorized", "Missing API key.", requestId),
    };
  }

  const apiKey = await ApiKey.byToken(token);
  if (!apiKey) {
    return {
      ok: false,
      response: jsonError(401, "unauthorized", "Invalid API key.", requestId),
    };
  }

  return { ok: true, apiKey };
}

function readApiKeyToken(request: NextRequest) {
  const headerToken = normalizedHeader(request.headers.get("x-api-key"));
  if (headerToken) return headerToken;

  const authorization = normalizedHeader(request.headers.get("authorization"));
  if (!authorization?.toLowerCase().startsWith("bearer ")) return null;

  return normalizedHeader(authorization.slice("bearer ".length));
}

function normalizedHeader(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function resolveLocationAndAuthorize(
  apiKey: AuthenticatedApiKey,
  input: {
    locationKey: string;
  },
  requestId: string | null,
): Promise<
  | {
      ok: true;
      location: Awaited<ReturnType<typeof Location.fromHandle>>;
    }
  | { ok: false; response: NextResponse }
> {
  const location = await findLocation(input.locationKey);
  if (!location) {
    return {
      ok: false,
      response: jsonError(404, "not_found", "Location not found.", requestId),
    };
  }

  const hasAccess = await ApiKey.userBoundApiKeyHasPrivilegeForLocation({
    apiKeyId: apiKey.id,
    privilegeHandle: BUCHUNG_IMPORT_PRIVILEGE,
    locationId: location.id,
  });

  if (!hasAccess) {
    return {
      ok: false,
      response: jsonError(
        403,
        "forbidden",
        "Missing Buchung import privilege for location.",
        requestId,
      ),
    };
  }

  return { ok: true, location };
}

async function resolveLocationCohortAndAuthorize(
  apiKey: AuthenticatedApiKey,
  input: {
    locationKey: string;
    cohortKey: string;
  },
  requestId: string | null,
): Promise<
  | {
      ok: true;
      location: Awaited<ReturnType<typeof Location.fromHandle>>;
      cohort: NonNullable<Awaited<ReturnType<typeof Cohort.byIdOrHandle>>>;
    }
  | { ok: false; response: NextResponse }
> {
  const resolved = await resolveLocationAndAuthorize(apiKey, input, requestId);
  if (!resolved.ok) return resolved;

  const cohort = await findCohort(resolved.location.id, input.cohortKey);
  if (!cohort) {
    return {
      ok: false,
      response: jsonError(404, "not_found", "Cohort not found.", requestId),
    };
  }

  return { ok: true, location: resolved.location, cohort };
}

async function findLocation(locationKey: string) {
  try {
    const id = uuidSchema.safeParse(locationKey);
    if (id.success) {
      return await Location.fromId(id.data);
    }

    const handle = handleSchema.safeParse(locationKey);
    if (handle.success) {
      return await Location.fromHandle(handle.data);
    }

    return null;
  } catch (error) {
    if (isMissingRowError(error)) return null;
    throw error;
  }
}

async function findCohort(locationId: string, cohortKey: string) {
  const id = uuidSchema.safeParse(cohortKey);
  const handle = handleSchema.safeParse(cohortKey);
  const cohort = id.success
    ? await Cohort.byIdOrHandle({ id: id.data })
    : handle.success
      ? await Cohort.byIdOrHandle({ handle: handle.data, locationId })
      : null;

  if (!cohort || cohort.locationId !== locationId) {
    return null;
  }

  return cohort;
}

function isMissingRowError(error: unknown) {
  return (
    error instanceof TypeError && error.message === "Expected 1 row, got 0"
  );
}

async function findSessionForLocation(input: {
  locationId: string;
  externalSessionKey: string;
}) {
  const sessions = (await ImportSession.list({
    locationId: input.locationId,
    sourceSystem: BUCHUNG_SOURCE_SYSTEM,
  })) as DomainSessionRecord[];

  return sessions.filter(
    (session) => session.externalSessionKey === input.externalSessionKey,
  );
}

async function getFullSession(sessionId: string) {
  const full = await ImportSession.get({ importSessionId: sessionId });
  return full as FullImportSession | null;
}

async function mapSession(
  session: DomainSessionRecord,
  input: {
    locationKey: string;
    cohortKey?: string;
    includeRows: false;
  },
): Promise<ImportSessionListModel>;
async function mapSession(
  session: DomainSessionRecord,
  input: {
    locationKey: string;
    cohortKey?: string;
    includeRows: true;
  },
): Promise<ImportSessionModel>;
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

  const base: ImportSessionListModel = {
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
  };
}

function mapStatus(status: DomainSessionStatus): ImportSessionStatus {
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

function rowValidation(row: DomainRow): ImportSessionRowValidationModel {
  const messages = normalizeMessages(row.validationErrors);
  const hasWarning = messages.some((message) => message.severity === "warning");

  return {
    status:
      row.status === "invalid" ? "invalid" : hasWarning ? "warning" : "valid",
    messages,
  };
}

function normalizeMessages(
  validationErrors: unknown,
): ImportSessionRowValidationMessageModel[] {
  if (!Array.isArray(validationErrors)) {
    return [];
  }

  return validationErrors.map((message: DomainValidationMessage) => {
    const normalized: ImportSessionRowValidationMessageModel = {
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

function mapRow(row: DomainRow): ImportSessionRowModel {
  const mapped: ImportSessionRowModel = {
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
    mapped.rawMetadata = row.rawPayload as Record<string, unknown> | null;
  }

  return mapped;
}

function jsonError(
  status: 400 | 401 | 403 | 404 | 409 | 500,
  code: ErrorCode,
  message: string,
  requestId: string | null,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      code,
      message,
      ...(requestId ? { requestId } : {}),
      ...(details ? { details } : {}),
    },
    { status },
  );
}
