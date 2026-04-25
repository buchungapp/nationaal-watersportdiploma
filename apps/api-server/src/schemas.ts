import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "invalid_request" }),
    message: z.string().openapi({ example: "Description of the error." }),
    requestId: z.string().nullable().optional(),
  })
  .openapi("ErrorResponse");

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
});

export const CohortSchema = z
  .object({
    id: z.string().uuid(),
    label: z.string(),
    handle: z.string(),
    locationId: z.string().uuid(),
    accessStartTime: z.string(),
    accessEndTime: z.string(),
    externalRef: z.string().nullable(),
    createdAt: z.string().datetime().or(z.string()),
  })
  .openapi("Cohort");

export const CohortListResponseSchema = z
  .object({
    items: z.array(CohortSchema),
    count: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  })
  .openapi("CohortListResponse");

export const CreateCohortRequestSchema = z
  .object({
    label: z.string().trim().min(1).max(120),
    handle: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9-]+$/),
    accessStartTime: z.string().datetime(),
    accessEndTime: z.string().datetime(),
    externalRef: z.string().trim().min(1).max(255).optional(),
  })
  .openapi("CreateCohortRequest");

export const CreateCohortResponseSchema = z
  .object({
    id: z.string().uuid(),
    created: z.boolean(),
  })
  .openapi("CreateCohortResponse");

export const StudentSchema = z
  .object({
    allocationId: z.string().uuid(),
    personId: z.string().uuid(),
    handle: z.string(),
    firstName: z.string().nullable(),
    lastNamePrefix: z.string().nullable(),
    lastName: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    tags: z.array(z.string()),
    externalRef: z.string().nullable(),
  })
  .openapi("Student");

export const StudentListResponseSchema = z
  .object({
    items: z.array(StudentSchema),
    count: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  })
  .openapi("StudentListResponse");

export const AddStudentRequestSchema = z
  .object({
    personId: z.string().uuid(),
    tags: z.array(z.string()).optional(),
    externalRef: z.string().trim().min(1).max(255).optional(),
  })
  .openapi("AddStudentRequest");

export const AddStudentResponseSchema = z
  .object({
    id: z.string().uuid(),
    created: z.boolean(),
  })
  .openapi("AddStudentResponse");

export const RemoveStudentResponseSchema = z
  .object({
    removed: z.boolean(),
  })
  .openapi("RemoveStudentResponse");

export const PersonLookupRequestSchema = z
  .object({
    handle: z.string().trim().min(1).optional(),
    email: z.string().email().optional(),
    firstName: z.string().trim().min(1).optional(),
    lastNamePrefix: z.string().trim().optional(),
    lastName: z.string().trim().min(1).optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
      .optional(),
    limit: z.number().int().min(1).max(20).default(5).optional(),
  })
  .refine(
    (d) =>
      Boolean(d.handle) ||
      Boolean(d.email) ||
      Boolean(d.firstName && d.lastName && d.dateOfBirth),
    {
      message:
        "Provide one of: handle, email, or (firstName + lastName + dateOfBirth).",
    },
  )
  .openapi("PersonLookupRequest");

export const PersonLookupCandidateSchema = z
  .object({
    id: z.string().uuid(),
    handle: z.string(),
    firstName: z.string(),
    lastNamePrefix: z.string().nullable(),
    lastName: z.string().nullable(),
    similarity: z.number().min(0).max(1).nullable(),
  })
  .openapi("PersonLookupCandidate");

export const PersonLookupResponseSchema = z
  .object({
    match: z.enum(["strict", "fuzzy", "none"]),
    candidate: PersonLookupCandidateSchema.nullable(),
    candidates: z.array(PersonLookupCandidateSchema),
  })
  .openapi("PersonLookupResponse");

export const CertificateSchema = z
  .object({
    id: z.string().uuid(),
    handle: z.string(),
    issuedAt: z.string().nullable(),
    visibleFrom: z.string().nullable(),
    locationId: z.string().uuid(),
    courseTitle: z.string().nullable(),
    programTitle: z.string().nullable(),
    gearTypeTitle: z.string().nullable(),
    curriculumRevision: z.string().nullable(),
  })
  .openapi("Certificate");

export const CertificateListResponseSchema = z
  .object({
    items: z.array(CertificateSchema),
    count: z.number().int().nonnegative(),
  })
  .openapi("CertificateListResponse");
