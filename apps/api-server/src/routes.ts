import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  Auth,
  Certificate,
  Cohort,
  Course,
  Curriculum,
  User,
} from "@nawadi/core";
import type { Context } from "hono";
import {
  ensureScope,
  type ApiClient,
  ScopeError,
  UnauthorizedError,
  verifyAccessToken,
} from "./auth.js";
import {
  AddStudentRequestSchema,
  AddStudentResponseSchema,
  CertificateListResponseSchema,
  CertificateSchema,
  CohortListResponseSchema,
  CohortSchema,
  CreateCohortRequestSchema,
  CreateCohortResponseSchema,
  ErrorResponseSchema,
  PersonLookupRequestSchema,
  PersonLookupResponseSchema,
  RemoveStudentResponseSchema,
  StudentListResponseSchema,
  StudentSchema,
} from "./schemas.js";

type Variables = {
  client: ApiClient;
  requestId: string;
  startedAt: number;
  requestBody: unknown;
};

interface RouteOptions {
  issuer: string;
}

export const requireAuth = (issuer: string) =>
  async (c: Context<{ Variables: Variables }>, next: () => Promise<void>) => {
    const auth = c.req.header("authorization");
    try {
      const { client } = await verifyAccessToken(auth, { issuer });
      c.set("client", client);
      await next();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return c.json(
          {
            error: err.code,
            message: err.message,
            requestId: c.get("requestId"),
          },
          401,
        );
      }
      throw err;
    }
  };

function scopeError(c: Context<{ Variables: Variables }>, err: ScopeError) {
  return c.json(
    {
      error: "insufficient_scope",
      message: err.message,
      requestId: c.get("requestId"),
    },
    403,
  );
}

function genericError<S extends 400 | 401 | 403 | 404 | 409>(
  c: Context<{ Variables: Variables }>,
  status: S,
  code: string,
  message: string,
) {
  return c.json(
    { error: code, message, requestId: c.get("requestId") },
    status,
  );
}

export function registerRoutes(
  app: OpenAPIHono<{ Variables: Variables }>,
  _options: RouteOptions,
): void {
  // ---- GET /v1/cohorts ----
  const listCohortsRoute = createRoute({
    method: "get",
    path: "/v1/cohorts",
    summary: "List cohorts at the authenticated vaarschool",
    tags: ["Cohorts"],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        limit: z.coerce.number().int().positive().max(100).optional(),
        offset: z.coerce.number().int().nonnegative().optional(),
      }),
    },
    responses: {
      200: {
        description: "List of cohorts",
        content: { "application/json": { schema: CohortListResponseSchema } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      403: {
        description: "Insufficient scope",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });

  app.openapi(listCohortsRoute, async (c) => {
    const client = c.get("client");
    try {
      ensureScope(client, "cohorts:read");
    } catch (err) {
      if (err instanceof ScopeError) return scopeError(c, err);
      throw err;
    }

    const { limit, offset } = c.req.valid("query");
    const result = await Cohort.Api.apiListCohorts({
      locationId: client.vaarschoolId,
      limit: limit ?? 50,
      offset: offset ?? 0,
    });

    return c.json(
      {
        items: result.items.map((row) => ({
          id: row.id,
          label: row.label,
          handle: row.handle ?? "",
          locationId: row.locationId,
          accessStartTime: String(row.accessStartTime),
          accessEndTime: String(row.accessEndTime),
          externalRef: row.externalRef ?? null,
          createdAt: String(row.createdAt),
        })),
        count: result.count,
        limit: result.limit,
        offset: result.offset,
      },
      200,
    );
  });

  // ---- POST /v1/cohorts ----
  const createCohortRoute = createRoute({
    method: "post",
    path: "/v1/cohorts",
    summary: "Create a cohort (idempotent on externalRef)",
    tags: ["Cohorts"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: CreateCohortRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Cohort already existed (idempotent return)",
        content: { "application/json": { schema: CreateCohortResponseSchema } },
      },
      201: {
        description: "Cohort created",
        content: { "application/json": { schema: CreateCohortResponseSchema } },
      },
      400: {
        description: "Invalid request",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      403: {
        description: "Insufficient scope",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });

  app.openapi(createCohortRoute, async (c) => {
    const client = c.get("client");
    try {
      ensureScope(client, "cohorts:write");
    } catch (err) {
      if (err instanceof ScopeError) return scopeError(c, err);
      throw err;
    }

    const body = c.req.valid("json");
    try {
      const result = await Cohort.Api.apiCreateCohort({
        locationId: client.vaarschoolId,
        oauthClientId: client.oauthClientId,
        label: body.label,
        handle: body.handle,
        accessStartTime: body.accessStartTime,
        accessEndTime: body.accessEndTime,
        externalRef: body.externalRef,
      });
      return c.json(result, result.created ? 201 : 200);
    } catch (err) {
      if (err instanceof Error && err.message.includes("accessStartTime")) {
        return genericError(c, 400, "invalid_request", err.message);
      }
      throw err;
    }
  });

  // ---- GET /v1/cohorts/{cohortId}/students ----
  const listStudentsRoute = createRoute({
    method: "get",
    path: "/v1/cohorts/{cohortId}/students",
    summary: "List students in a cohort",
    tags: ["Students"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ cohortId: z.string().uuid() }),
      query: z.object({
        limit: z.coerce.number().int().positive().max(200).optional(),
        offset: z.coerce.number().int().nonnegative().optional(),
      }),
    },
    responses: {
      200: {
        description: "List of students",
        content: { "application/json": { schema: StudentListResponseSchema } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      403: {
        description: "Insufficient scope",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      404: {
        description: "Cohort not found",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });

  app.openapi(listStudentsRoute, async (c) => {
    const client = c.get("client");
    try {
      ensureScope(client, "cohorts:read");
    } catch (err) {
      if (err instanceof ScopeError) return scopeError(c, err);
      throw err;
    }

    const { cohortId } = c.req.valid("param");
    const { limit, offset } = c.req.valid("query");

    const result = await Cohort.Api.apiListStudents({
      cohortId,
      vaarschoolId: client.vaarschoolId,
      limit: limit ?? 100,
      offset: offset ?? 0,
    });

    if (result.count === 0 && result.offset === 0) {
      // Confirm cohort exists for clearer 404 vs empty list distinction
      const cohort = await Cohort.Api.apiGetCohort({
        cohortId,
        locationId: client.vaarschoolId,
      });
      if (!cohort) {
        return genericError(c, 404, "cohort_not_found", "Cohort not found");
      }
    }

    return c.json(result, 200);
  });

  // ---- POST /v1/cohorts/{cohortId}/students ----
  const addStudentRoute = createRoute({
    method: "post",
    path: "/v1/cohorts/{cohortId}/students",
    summary: "Enroll a student in a cohort (idempotent on externalRef)",
    tags: ["Students"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ cohortId: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": { schema: AddStudentRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Student already enrolled (idempotent return)",
        content: { "application/json": { schema: AddStudentResponseSchema } },
      },
      201: {
        description: "Student enrolled",
        content: { "application/json": { schema: AddStudentResponseSchema } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      403: {
        description: "Insufficient scope",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      404: {
        description: "Cohort or person not found / not linked",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });

  app.openapi(addStudentRoute, async (c) => {
    const client = c.get("client");
    try {
      ensureScope(client, "cohorts:write");
    } catch (err) {
      if (err instanceof ScopeError) return scopeError(c, err);
      throw err;
    }

    const { cohortId } = c.req.valid("param");
    const body = c.req.valid("json");

    try {
      const result = await Cohort.Api.apiAddStudent({
        cohortId,
        personId: body.personId,
        oauthClientId: client.oauthClientId,
        vaarschoolId: client.vaarschoolId,
        tags: body.tags,
        externalRef: body.externalRef,
      });
      return c.json(result, result.created ? 201 : 200);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "cohort_not_found") {
        return genericError(c, 404, "cohort_not_found", "Cohort not found");
      }
      if (code === "person_not_linked") {
        return genericError(
          c,
          404,
          "person_not_linked",
          "Person not linked to this vaarschool",
        );
      }
      throw err;
    }
  });

  // ---- DELETE /v1/cohorts/{cohortId}/students/{allocationId} ----
  const removeStudentRoute = createRoute({
    method: "delete",
    path: "/v1/cohorts/{cohortId}/students/{allocationId}",
    summary: "Remove a student from a cohort",
    tags: ["Students"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        cohortId: z.string().uuid(),
        allocationId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Removed (or already absent)",
        content: {
          "application/json": { schema: RemoveStudentResponseSchema },
        },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      403: {
        description: "Insufficient scope",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      404: {
        description: "Allocation not found",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });

  app.openapi(removeStudentRoute, async (c) => {
    const client = c.get("client");
    try {
      ensureScope(client, "cohorts:write");
    } catch (err) {
      if (err instanceof ScopeError) return scopeError(c, err);
      throw err;
    }

    const { cohortId, allocationId } = c.req.valid("param");

    const result = await Cohort.Api.apiRemoveStudent({
      cohortId,
      allocationId,
      oauthClientId: client.oauthClientId,
      vaarschoolId: client.vaarschoolId,
    });

    if (!result.removed) {
      return genericError(c, 404, "allocation_not_found", "Allocation not found");
    }
    return c.json(result, 200);
  });

  // ---- POST /v1/persons/lookup ----
  const personLookupRoute = createRoute({
    method: "post",
    path: "/v1/persons/lookup",
    summary: "Look up a person by handle, email, or name+DOB",
    tags: ["Persons"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: PersonLookupRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Lookup result",
        content: { "application/json": { schema: PersonLookupResponseSchema } },
      },
      400: {
        description: "Invalid request",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      403: {
        description: "Insufficient scope",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });

  app.openapi(personLookupRoute, async (c) => {
    const client = c.get("client");
    try {
      ensureScope(client, "persons:lookup");
    } catch (err) {
      if (err instanceof ScopeError) return scopeError(c, err);
      throw err;
    }

    const body = c.req.valid("json");

    try {
      const result = await User.Person.lookup({
        vaarschoolId: client.vaarschoolId,
        handle: body.handle,
        email: body.email,
        firstName: body.firstName,
        lastNamePrefix: body.lastNamePrefix,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        limit: body.limit ?? 5,
      });

      const stripPii = (
        cand: {
          id: string;
          handle: string;
          firstName: string;
          lastNamePrefix: string | null;
          lastName: string | null;
          similarity: number | null;
        } & Record<string, unknown>,
      ) => ({
        id: cand.id,
        handle: cand.handle,
        firstName: cand.firstName,
        lastNamePrefix: cand.lastNamePrefix,
        lastName: cand.lastName,
        similarity: cand.similarity,
      });

      return c.json(
        {
          match: result.match,
          candidate: result.candidate ? stripPii(result.candidate) : null,
          candidates: result.candidates.map(stripPii),
        },
        200,
      );
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("provide")) {
        return genericError(c, 400, "invalid_request", err.message);
      }
      throw err;
    }
  });

  // ---- GET /v1/persons/{handle}/certificates ----
  const personCertsRoute = createRoute({
    method: "get",
    path: "/v1/persons/{handle}/certificates",
    summary: "List certificates issued to a person at the authenticated vaarschool",
    tags: ["Certificates"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ handle: z.string().min(1) }),
    },
    responses: {
      200: {
        description: "List of certificates",
        content: {
          "application/json": { schema: CertificateListResponseSchema },
        },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      403: {
        description: "Insufficient scope",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      404: {
        description: "Person not found or not linked",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });

  app.openapi(personCertsRoute, async (c) => {
    const client = c.get("client");
    try {
      ensureScope(client, "certificates:read");
    } catch (err) {
      if (err instanceof ScopeError) return scopeError(c, err);
      throw err;
    }

    const { handle } = c.req.valid("param");

    let person: { id: string } | null = null;
    try {
      const found = await User.Person.byIdOrHandle({ handle });
      person = found ? { id: found.id } : null;
    } catch {
      person = null;
    }

    if (!person) {
      return genericError(c, 404, "person_not_found", "Person not found");
    }

    const linked = await User.Person.isLinkedToLocation({
      personId: person.id,
      locationId: client.vaarschoolId,
    });
    if (!linked) {
      return genericError(c, 404, "person_not_found", "Person not found");
    }

    const list = await Certificate.list({
      filter: {
        personId: person.id,
        locationId: client.vaarschoolId,
      },
      respectVisibility: true,
    });

    const items = (list.items ?? []).map((item) => ({
      id: item.id,
      handle: item.handle,
      issuedAt: item.issuedAt ? String(item.issuedAt) : null,
      visibleFrom: item.visibleFrom ? String(item.visibleFrom) : null,
      locationId: item.locationId,
      courseTitle: item.program?.title ?? null,
      programTitle: item.program?.title ?? null,
      gearTypeTitle: item.gearType?.title ?? null,
      curriculumRevision: item.curriculum?.revision ?? null,
    }));

    return c.json({ items, count: list.count ?? items.length }, 200);
  });
}

// Avoid 'declared but not used' on imports we keep for future expansion
void Course;
void Curriculum;
void Auth;
void CohortSchema;
void StudentSchema;
void CertificateSchema;
