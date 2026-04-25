import { createRoute, z } from "@hono/zod-openapi";
import { Cohort } from "@nawadi/core";
import { createOpenAPIApp } from "../lib/openapi-app.js";
import { withRequiredScope } from "../middleware/scope.js";
import {
  AddStudentRequestSchema,
  AddStudentResponseSchema,
  ErrorResponseSchema,
  RemoveStudentResponseSchema,
  StudentListResponseSchema,
} from "../schemas.js";

const app = createOpenAPIApp();

const listRoute = createRoute({
  method: "get",
  path: "/{cohortId}/students",
  summary: "List students in a cohort",
  tags: ["Students"],
  security: [{ bearerAuth: [] }],
  middleware: [withRequiredScope("cohorts:read")] as const,
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

app.openapi(listRoute, async (c) => {
  const client = c.get("client");
  const { cohortId } = c.req.valid("param");
  const { limit, offset } = c.req.valid("query");

  const result = await Cohort.Api.apiListStudents({
    cohortId,
    vaarschoolId: client.vaarschoolId,
    limit: limit ?? 100,
    offset: offset ?? 0,
  });

  if (result.count === 0 && result.offset === 0) {
    const cohort = await Cohort.Api.apiGetCohort({
      cohortId,
      locationId: client.vaarschoolId,
    });
    if (!cohort) {
      return c.json(
        {
          error: "cohort_not_found",
          message: "Cohort not found",
          requestId: c.get("requestId"),
        },
        404,
      );
    }
  }

  return c.json(result, 200);
});

const addRoute = createRoute({
  method: "post",
  path: "/{cohortId}/students",
  summary: "Enroll a student in a cohort (idempotent on externalRef)",
  tags: ["Students"],
  security: [{ bearerAuth: [] }],
  middleware: [withRequiredScope("cohorts:write")] as const,
  request: {
    params: z.object({ cohortId: z.string().uuid() }),
    body: {
      required: true,
      content: { "application/json": { schema: AddStudentRequestSchema } },
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

app.openapi(addRoute, async (c) => {
  const client = c.get("client");
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
      return c.json(
        {
          error: "cohort_not_found",
          message: "Cohort not found",
          requestId: c.get("requestId"),
        },
        404,
      );
    }
    if (code === "person_not_linked") {
      return c.json(
        {
          error: "person_not_linked",
          message: "Person not linked to this vaarschool",
          requestId: c.get("requestId"),
        },
        404,
      );
    }
    throw err;
  }
});

const removeRoute = createRoute({
  method: "delete",
  path: "/{cohortId}/students/{allocationId}",
  summary: "Remove a student from a cohort",
  tags: ["Students"],
  security: [{ bearerAuth: [] }],
  middleware: [withRequiredScope("cohorts:write")] as const,
  request: {
    params: z.object({
      cohortId: z.string().uuid(),
      allocationId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Removed (or already absent)",
      content: { "application/json": { schema: RemoveStudentResponseSchema } },
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

app.openapi(removeRoute, async (c) => {
  const client = c.get("client");
  const { cohortId, allocationId } = c.req.valid("param");

  const result = await Cohort.Api.apiRemoveStudent({
    cohortId,
    allocationId,
    oauthClientId: client.oauthClientId,
    vaarschoolId: client.vaarschoolId,
  });

  if (!result.removed) {
    return c.json(
      {
        error: "allocation_not_found",
        message: "Allocation not found",
        requestId: c.get("requestId"),
      },
      404,
    );
  }
  return c.json(result, 200);
});

export const studentsRouter = app;
