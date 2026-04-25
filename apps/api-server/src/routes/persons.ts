import { createRoute, z } from "@hono/zod-openapi";
import { Certificate, User } from "@nawadi/core";
import { createOpenAPIApp } from "../lib/openapi-app.js";
import { withRequiredScope } from "../middleware/scope.js";
import {
  CertificateListResponseSchema,
  ErrorResponseSchema,
  PersonLookupRequestSchema,
  PersonLookupResponseSchema,
} from "../schemas.js";

const app = createOpenAPIApp();

const lookupRoute = createRoute({
  method: "post",
  path: "/lookup",
  summary: "Look up a person by handle, email, or name+DOB",
  tags: ["Persons"],
  security: [{ bearerAuth: [] }],
  middleware: [withRequiredScope("persons:lookup")] as const,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: PersonLookupRequestSchema } },
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

app.openapi(lookupRoute, async (c) => {
  const client = c.get("client");
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

    // Project away PII (email, DOB) before returning. The partner only
    // needs the handle to follow up; everything else is a privacy leak.
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

const certsRoute = createRoute({
  method: "get",
  path: "/{handle}/certificates",
  summary: "List certificates issued to a person at the authenticated vaarschool",
  tags: ["Certificates"],
  security: [{ bearerAuth: [] }],
  middleware: [withRequiredScope("certificates:read")] as const,
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

app.openapi(certsRoute, async (c) => {
  const client = c.get("client");
  const { handle } = c.req.valid("param");

  let person: { id: string } | null = null;
  try {
    const found = await User.Person.byIdOrHandle({ handle });
    person = found ? { id: found.id } : null;
  } catch {
    person = null;
  }

  if (!person) {
    return c.json(
      {
        error: "person_not_found",
        message: "Person not found",
        requestId: c.get("requestId"),
      },
      404,
    );
  }

  const linked = await User.Person.isLinkedToLocation({
    personId: person.id,
    locationId: client.vaarschoolId,
  });
  if (!linked) {
    return c.json(
      {
        error: "person_not_found",
        message: "Person not found",
        requestId: c.get("requestId"),
      },
      404,
    );
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

export const personsRouter = app;
