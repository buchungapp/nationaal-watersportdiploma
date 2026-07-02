import {
  ApiKey,
  Cohort,
  ImportSession,
  Location,
  withDatabase,
} from "@nawadi/core";
import { Effect, Layer, Schema } from "effect";
import {
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";

const IMPORT_SESSION_READ_PRIVILEGE = "import-session:read";
const IMPORT_SESSION_WRITE_PRIVILEGE = "import-session:write";
const BUCHUNG_SOURCE_SYSTEM = "buchung";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const handlePattern = /^[a-z0-9-]{3,}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nonEmptyStringSchema = Schema.String.check(Schema.isNonEmpty());
const pathKeySchema = Schema.String.check(Schema.isNonEmpty());
const externalSessionKeySchema = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(255),
);
const rawMetadataSchema = Schema.NullOr(
  Schema.Record(Schema.String, Schema.Unknown),
);
const nullableStringSchema = Schema.NullOr(Schema.String);

const importSessionSourceSchema = Schema.Struct({
  vendor: nonEmptyStringSchema,
  exportedAt: Schema.optional(
    Schema.String.check(Schema.isPattern(dateTimePattern)),
  ),
  metadata: Schema.optional(rawMetadataSchema),
});

const upsertCohortSchema = Schema.Struct({
  source: importSessionSourceSchema,
  label: nonEmptyStringSchema,
  accessStartTime: Schema.String.check(Schema.isPattern(dateTimePattern)),
  accessEndTime: Schema.String.check(Schema.isPattern(dateTimePattern)),
});

const upsertImportSessionRowSchema = Schema.Struct({
  externalRowKey: externalSessionKeySchema,
  externalPersonKey: Schema.optional(Schema.NullOr(externalSessionKeySchema)),
  rowIndex: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  firstName: Schema.optional(nullableStringSchema),
  lastNamePrefix: Schema.optional(nullableStringSchema),
  lastName: Schema.optional(nullableStringSchema),
  dateOfBirth: Schema.optional(
    Schema.NullOr(Schema.String.check(Schema.isPattern(datePattern))),
  ),
  birthCity: Schema.optional(nullableStringSchema),
  birthCountry: Schema.optional(nullableStringSchema),
  email: Schema.optional(
    Schema.NullOr(Schema.String.check(Schema.isPattern(emailPattern))),
  ),
  tags: Schema.optional(Schema.Array(Schema.String)),
  rawMetadata: Schema.optional(rawMetadataSchema),
});

const upsertImportSessionSchema = Schema.Struct({
  source: importSessionSourceSchema,
  rows: Schema.Array(upsertImportSessionRowSchema),
});

const listParamsSchema = Schema.Struct({
  locationKey: pathKeySchema,
  cohortKey: pathKeySchema,
});

const upsertParamsSchema = Schema.Struct({
  locationKey: pathKeySchema,
  cohortKey: pathKeySchema,
  externalSessionKey: externalSessionKeySchema,
});

const retrieveParamsSchema = Schema.Struct({
  locationKey: pathKeySchema,
  externalSessionKey: externalSessionKeySchema,
});

type UpsertImportSessionRequest = Schema.Schema.Type<
  typeof upsertImportSessionSchema
>;

type UpsertCohortRequest = Schema.Schema.Type<typeof upsertCohortSchema>;

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
  externalPersonKey: string | null;
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
  externalPersonKey?: string | null;
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

type CohortModel = {
  locationKey: string;
  cohortKey: string;
  label: string;
  accessStartTime: string;
  accessEndTime: string;
};

type AuthenticatedApiKey = {
  id: string;
  userId: string;
};

class ImportSessionRouteError {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 500,
    readonly code: ErrorCode,
    readonly message: string,
    readonly details?: Record<string, unknown>,
  ) {}
}

type RouteContext = {
  request: HttpServerRequest.HttpServerRequest;
  requestId: string | null;
};

const ApiRoutes = Layer.mergeAll(
  HttpRouter.add(
    "PUT",
    "/api/location/:locationKey/cohort/:cohortKey",
    guardedRoute(({ request, requestId }) =>
      Effect.gen(function* () {
        const params = yield* HttpRouter.schemaPathParams(listParamsSchema);
        const requestEntity =
          yield* HttpServerRequest.schemaBodyJson(upsertCohortSchema);

        return yield* withImportSessionDatabase(requestId, async () => {
          const normalizedParams = normalizeListParams(params);
          const authentication = await authenticateApiKey(request);
          const resolved = await resolveLocationAndAuthorize(authentication, {
            locationKey: normalizedParams.locationKey,
            privilegeHandle: IMPORT_SESSION_WRITE_PRIVILEGE,
          });

          return upsertLocationCohort(
            resolved.location,
            normalizedParams.cohortKey,
            requestEntity,
          );
        });
      }),
    ),
  ),
  HttpRouter.add(
    "GET",
    "/api/location/:locationKey/cohort/:cohortKey/import-session",
    guardedRoute(({ request, requestId }) =>
      Effect.gen(function* () {
        const params = yield* HttpRouter.schemaPathParams(listParamsSchema);

        return yield* withImportSessionDatabase(requestId, async () => {
          const authentication = await authenticateApiKey(request);
          const resolved = await resolveLocationCohortAndAuthorize(
            authentication,
            normalizeListParams(params),
            IMPORT_SESSION_READ_PRIVILEGE,
          );

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

          return jsonResponse(entity);
        });
      }),
    ),
  ),
  HttpRouter.add(
    "PUT",
    "/api/location/:locationKey/cohort/:cohortKey/import-session/:externalSessionKey",
    guardedRoute(({ request, requestId }) =>
      Effect.gen(function* () {
        const params = yield* HttpRouter.schemaPathParams(upsertParamsSchema);
        const requestEntity = yield* HttpServerRequest.schemaBodyJson(
          upsertImportSessionSchema,
        );

        return yield* withImportSessionDatabase(requestId, async () => {
          const normalizedParams = normalizeUpsertParams(params);
          const authentication = await authenticateApiKey(request);
          const resolved = await resolveLocationCohortAndAuthorize(
            authentication,
            normalizedParams,
            IMPORT_SESSION_WRITE_PRIVILEGE,
          );

          return upsertLocationCohortImportSession(
            authentication,
            resolved,
            normalizedParams.externalSessionKey,
            requestEntity,
          );
        });
      }),
    ),
  ),
  HttpRouter.add(
    "GET",
    "/api/location/:locationKey/import-session/:externalSessionKey",
    guardedRoute(({ request, requestId }) =>
      Effect.gen(function* () {
        const params = yield* HttpRouter.schemaPathParams(retrieveParamsSchema);

        return yield* withImportSessionDatabase(requestId, async () => {
          const normalizedParams = normalizeRetrieveParams(params);
          const authentication = await authenticateApiKey(request);
          const resolved = await resolveLocationAndAuthorize(authentication, {
            locationKey: normalizedParams.locationKey,
            privilegeHandle: IMPORT_SESSION_READ_PRIVILEGE,
          });

          return retrieveLocationImportSession(
            resolved.location,
            normalizedParams.externalSessionKey,
          );
        });
      }),
    ),
  ),
).pipe(Layer.provide(HttpServer.layerServices));

const importSessionApi = HttpRouter.toWebHandler(ApiRoutes, {
  disableLogger: true,
});
const importSessionApiHandler = importSessionApi.handler as (
  request: Request,
) => Promise<Response>;

export function handleImportSessionApiRequest(request: Request) {
  return importSessionApiHandler(request);
}

function guardedRoute(
  handler: (
    context: RouteContext,
  ) => Effect.Effect<
    HttpServerResponse.HttpServerResponse,
    unknown,
    HttpServerRequest.HttpServerRequest | HttpRouter.RouteContext
  >,
) {
  return Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const requestId = normalizedHeader(request.headers["x-request-id"] ?? null);

    return yield* Effect.catch(handler({ request, requestId }), (error) =>
      routeErrorResponse(error, requestId),
    );
  });
}

function withImportSessionDatabase(
  requestId: string | null,
  handler: () => Promise<HttpServerResponse.HttpServerResponse>,
) {
  const pgUri = process.env.PGURI;

  if (!pgUri) {
    return Effect.succeed(
      jsonError(
        500,
        "internal_error",
        "PGURI not configured on server.",
        requestId,
      ),
    );
  }

  return Effect.tryPromise({
    try: () => withDatabase(pgUri, handler),
    catch: (error) => error,
  });
}

function routeErrorResponse(error: unknown, requestId: string | null) {
  if (error instanceof ImportSessionRouteError) {
    return Effect.succeed(
      jsonError(
        error.status,
        error.code,
        error.message,
        requestId,
        error.details,
      ),
    );
  }

  if (isBadRequestError(error)) {
    return Effect.succeed(
      jsonError(
        400,
        "bad_request",
        "Invalid import-session request.",
        requestId,
        { issues: summarizeDecodeError(error) },
      ),
    );
  }

  console.error("Import-session route failed", error);
  return Effect.succeed(
    jsonError(
      500,
      "internal_error",
      "Import-session request failed.",
      requestId,
    ),
  );
}

async function upsertLocationCohortImportSession(
  authentication: AuthenticatedApiKey,
  resolved: {
    location: NonNullable<Awaited<ReturnType<typeof Location.fromHandle>>>;
    cohort: NonNullable<Awaited<ReturnType<typeof Cohort.byIdOrHandle>>>;
  },
  externalSessionKey: string,
  requestEntity: UpsertImportSessionRequest,
) {
  assertEnabledSourceSystem(requestEntity.source.vendor);

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
    throw new ImportSessionRouteError(
      409,
      "conflict",
      "Import session key already exists for a different cohort in this location.",
    );
  }

  const result = await ImportSession.upsertFullSnapshot({
    locationId: resolved.location.id,
    targetCohortId: resolved.cohort.id,
    sourceSystem: BUCHUNG_SOURCE_SYSTEM,
    externalSessionKey,
    receivedByTokenId: authentication.id,
    rows: requestEntity.rows.map((row) => ({
      rowIndex: row.rowIndex,
      externalRowKey: row.externalRowKey.trim(),
      externalPersonKey: nullableTrim(row.externalPersonKey),
      firstName: nullableTrim(row.firstName),
      lastNamePrefix: nullableTrim(row.lastNamePrefix),
      lastName: nullableTrim(row.lastName),
      dateOfBirth: row.dateOfBirth ?? undefined,
      birthCity: nullableTrim(row.birthCity),
      birthCountry: nullableTrim(row.birthCountry),
      email: nullableTrim(row.email),
      tags: [...(row.tags ?? [])],
      rawPayload: row.rawMetadata,
    })),
  });

  const full = await getFullSession(result.id);
  if (!full) {
    throw new ImportSessionRouteError(
      404,
      "not_found",
      "Import session not found.",
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

  return jsonResponse(entity, status);
}

async function upsertLocationCohort(
  location: NonNullable<Awaited<ReturnType<typeof Location.fromHandle>>>,
  cohortKey: string,
  requestEntity: UpsertCohortRequest,
) {
  assertEnabledSourceSystem(requestEntity.source.vendor);

  if (requestEntity.accessStartTime >= requestEntity.accessEndTime) {
    throw new ImportSessionRouteError(
      400,
      "bad_request",
      "accessStartTime must be before accessEndTime.",
    );
  }

  const existing = await findCohort(location.id, cohortKey);
  if (existing) {
    await Cohort.update({
      id: existing.id,
      data: {
        label: requestEntity.label.trim(),
        accessStartTime: requestEntity.accessStartTime,
        accessEndTime: requestEntity.accessEndTime,
      },
    });

    const updated = await Cohort.byIdOrHandle({ id: existing.id });
    if (!updated) {
      throw new ImportSessionRouteError(404, "not_found", "Cohort not found.");
    }

    return jsonResponse(mapCohort(updated, location.handle));
  }

  if (isUuid(cohortKey)) {
    throw new ImportSessionRouteError(404, "not_found", "Cohort not found.");
  }

  const created = await Cohort.create({
    locationId: location.id,
    handle: cohortKey,
    label: requestEntity.label.trim(),
    accessStartTime: requestEntity.accessStartTime,
    accessEndTime: requestEntity.accessEndTime,
  });
  const cohort = await Cohort.byIdOrHandle({ id: created.id });
  if (!cohort) {
    throw new ImportSessionRouteError(404, "not_found", "Cohort not found.");
  }

  return jsonResponse(mapCohort(cohort, location.handle), 201);
}

async function retrieveLocationImportSession(
  location: NonNullable<Awaited<ReturnType<typeof Location.fromHandle>>>,
  externalSessionKey: string,
) {
  const sessions = await findSessionForLocation({
    locationId: location.id,
    externalSessionKey,
  });

  if (sessions.length === 0) {
    throw new ImportSessionRouteError(
      404,
      "not_found",
      "Import session not found.",
    );
  }

  const cohortIds = new Set(sessions.map((session) => session.targetCohortId));
  if (cohortIds.size > 1) {
    throw new ImportSessionRouteError(
      404,
      "not_found",
      "Import session key is ambiguous in this location.",
    );
  }

  const session = sessions.toSorted((a, b) => b.generation - a.generation)[0];
  if (!session) {
    throw new ImportSessionRouteError(
      404,
      "not_found",
      "Import session not found.",
    );
  }

  const cohort = await Cohort.byIdOrHandle({ id: session.targetCohortId });
  if (!cohort || cohort.locationId !== location.id) {
    throw new ImportSessionRouteError(
      404,
      "not_found",
      "Import session not found.",
    );
  }

  const entity = await mapSession(session, {
    locationKey: location.handle,
    cohortKey: cohort.handle,
    includeRows: true,
  });

  return jsonResponse(entity);
}

function assertEnabledSourceSystem(vendor: string) {
  if (vendor.trim().toLowerCase() !== BUCHUNG_SOURCE_SYSTEM) {
    throw new ImportSessionRouteError(
      400,
      "bad_request",
      "source.vendor is not enabled for this import-session API.",
    );
  }
}

async function authenticateApiKey(
  request: HttpServerRequest.HttpServerRequest,
): Promise<AuthenticatedApiKey> {
  const token = readApiKeyToken(request);
  if (!token) {
    throw new ImportSessionRouteError(401, "unauthorized", "Missing API key.");
  }

  const apiKey = await ApiKey.byToken(token);
  if (!apiKey) {
    throw new ImportSessionRouteError(401, "unauthorized", "Invalid API key.");
  }

  return apiKey;
}

function readApiKeyToken(request: HttpServerRequest.HttpServerRequest) {
  const headerToken = normalizedHeader(request.headers["x-api-key"] ?? null);
  if (headerToken) return headerToken;

  const authorization = normalizedHeader(request.headers.authorization ?? null);
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
    privilegeHandle: string;
  },
) {
  const location = await findLocation(input.locationKey);
  if (!location) {
    throw new ImportSessionRouteError(404, "not_found", "Location not found.");
  }

  const hasAccess = await ApiKey.userBoundApiKeyHasPrivilegeForLocation({
    apiKeyId: apiKey.id,
    privilegeHandle: input.privilegeHandle,
    locationId: location.id,
  });

  if (!hasAccess) {
    throw new ImportSessionRouteError(
      403,
      "forbidden",
      "Missing import-session privilege for location.",
    );
  }

  return { location };
}

async function resolveLocationCohortAndAuthorize(
  apiKey: AuthenticatedApiKey,
  input: {
    locationKey: string;
    cohortKey: string;
  },
  privilegeHandle: string,
) {
  const resolved = await resolveLocationAndAuthorize(apiKey, {
    locationKey: input.locationKey,
    privilegeHandle,
  });

  const cohort = await findCohort(resolved.location.id, input.cohortKey);
  if (!cohort) {
    throw new ImportSessionRouteError(404, "not_found", "Cohort not found.");
  }

  return { location: resolved.location, cohort };
}

async function findLocation(locationKey: string) {
  try {
    if (isUuid(locationKey)) {
      return await Location.fromId(locationKey);
    }

    if (isHandle(locationKey)) {
      return await Location.fromHandle(locationKey);
    }

    return null;
  } catch (error) {
    if (isMissingRowError(error)) return null;
    throw error;
  }
}

async function findCohort(locationId: string, cohortKey: string) {
  const cohort = isUuid(cohortKey)
    ? await Cohort.byIdOrHandle({ id: cohortKey })
    : isHandle(cohortKey)
      ? await Cohort.byIdOrHandle({ handle: cohortKey, locationId })
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
    externalPersonKey: row.externalPersonKey,
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

function mapCohort(
  cohort: NonNullable<Awaited<ReturnType<typeof Cohort.byIdOrHandle>>>,
  locationKey: string,
): CohortModel {
  return {
    locationKey,
    cohortKey: cohort.handle,
    label: cohort.label,
    accessStartTime: cohort.accessStartTime,
    accessEndTime: cohort.accessEndTime,
  };
}

function normalizeListParams(
  params: Schema.Schema.Type<typeof listParamsSchema>,
) {
  return {
    locationKey: normalizePathKey(params.locationKey),
    cohortKey: normalizePathKey(params.cohortKey),
  };
}

function normalizeUpsertParams(
  params: Schema.Schema.Type<typeof upsertParamsSchema>,
) {
  return {
    locationKey: normalizePathKey(params.locationKey),
    cohortKey: normalizePathKey(params.cohortKey),
    externalSessionKey: normalizeExternalSessionKey(params.externalSessionKey),
  };
}

function normalizeRetrieveParams(
  params: Schema.Schema.Type<typeof retrieveParamsSchema>,
) {
  return {
    locationKey: normalizePathKey(params.locationKey),
    externalSessionKey: normalizeExternalSessionKey(params.externalSessionKey),
  };
}

function normalizePathKey(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!isUuid(normalized) && !isHandle(normalized)) {
    throw new ImportSessionRouteError(
      400,
      "bad_request",
      "Path key must be a UUID or handle.",
    );
  }

  return normalized;
}

function normalizeExternalSessionKey(value: string) {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 255) {
    throw new ImportSessionRouteError(
      400,
      "bad_request",
      "externalSessionKey must be between 1 and 255 characters.",
    );
  }

  return normalized;
}

function nullableTrim(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() || null : value;
}

function isUuid(value: string) {
  return uuidPattern.test(value);
}

function isHandle(value: string) {
  return handlePattern.test(value);
}

function isBadRequestError(error: unknown) {
  if (error instanceof SyntaxError) return true;

  const tag = errorTag(error);
  return (
    tag === "SchemaError" || tag === "RequestError" || tag === "HttpServerError"
  );
}

function summarizeDecodeError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Request could not be decoded.";

  return [{ path: "", message }];
}

function errorTag(error: unknown) {
  return typeof error === "object" && error !== null && "_tag" in error
    ? String(error._tag)
    : null;
}

function jsonResponse(body: unknown, status = 200) {
  return HttpServerResponse.setStatus(
    HttpServerResponse.jsonUnsafe(body),
    status,
  );
}

function jsonError(
  status: 400 | 401 | 403 | 404 | 409 | 500,
  code: ErrorCode,
  message: string,
  requestId: string | null,
  details?: Record<string, unknown>,
) {
  return jsonResponse(
    {
      code,
      message,
      ...(requestId ? { requestId } : {}),
      ...(details ? { details } : {}),
    },
    status,
  );
}
