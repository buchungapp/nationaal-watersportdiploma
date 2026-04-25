import { createRoute, z } from "@hono/zod-openapi";
import { Cohort } from "@nawadi/core";
import { createOpenAPIApp } from "../lib/openapi-app.js";
import { withRequiredScope } from "../middleware/scope.js";
import {
  CohortListResponseSchema,
  CreateCohortRequestSchema,
  CreateCohortResponseSchema,
  ErrorResponseSchema,
} from "../schemas.js";

const app = createOpenAPIApp();

const listRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List cohorts at the authenticated vaarschool",
  tags: ["Cohorts"],
  security: [{ bearerAuth: [] }],
  middleware: [withRequiredScope("cohorts:read")] as const,
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

app.openapi(listRoute, async (c) => {
  const client = c.get("client");
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

const createRouteSpec = createRoute({
  method: "post",
  path: "/",
  summary: "Create a cohort (idempotent on externalRef)",
  tags: ["Cohorts"],
  security: [{ bearerAuth: [] }],
  middleware: [withRequiredScope("cohorts:write")] as const,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateCohortRequestSchema } },
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

app.openapi(createRouteSpec, async (c) => {
  const client = c.get("client");
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
      return c.json(
        {
          error: "invalid_request",
          message: err.message,
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    throw err;
  }
});

export const cohortsRouter = app;
