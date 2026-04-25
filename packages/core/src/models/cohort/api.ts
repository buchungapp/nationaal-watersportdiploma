import { schema as s } from "@nawadi/db";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { selectSchema as cohortSelectSchema } from "./cohort.schema.js";

const externalRefSchema = z.string().trim().min(1).max(255);

export const apiCreateCohort = wrapCommand(
  "cohort.api.createCohort",
  withZod(
    z
      .object({
        locationId: uuidSchema,
        oauthClientId: uuidSchema,
        label: z.string().trim().min(1),
        handle: handleSchema,
        accessStartTime: z.string().datetime(),
        accessEndTime: z.string().datetime(),
        externalRef: externalRefSchema.optional(),
      })
      .refine((d) => d.accessStartTime < d.accessEndTime, {
        message: "accessStartTime must be before accessEndTime",
      }),
    z.object({ id: uuidSchema, created: z.boolean() }),
    async (input) => {
      return withTransaction(async (tx) => {
        if (input.externalRef) {
          // Race-safe upsert keyed on partial unique index
          // (location_id, created_by_oauth_client_id, external_ref)
          // WHERE deleted_at IS NULL AND external_ref IS NOT NULL.
          // No-op SET so RETURNING fires for both insert and conflict;
          // xmax=0 distinguishes a fresh insert from a re-hit row.
          const row = await tx
            .insert(s.cohort)
            .values({
              locationId: input.locationId,
              label: input.label,
              handle: input.handle,
              accessStartTime: input.accessStartTime,
              accessEndTime: input.accessEndTime,
              createdByOauthClientId: input.oauthClientId,
              externalRef: input.externalRef,
            })
            .onConflictDoUpdate({
              target: [
                s.cohort.locationId,
                s.cohort.createdByOauthClientId,
                s.cohort.externalRef,
              ],
              targetWhere: sql`deleted_at IS NULL AND external_ref IS NOT NULL`,
              set: { externalRef: sql`EXCLUDED.external_ref` },
            })
            .returning({
              id: s.cohort.id,
              created: sql<boolean>`xmax = 0`,
            })
            .then(singleRow);

          return { id: row.id, created: row.created };
        }

        const row = await tx
          .insert(s.cohort)
          .values({
            locationId: input.locationId,
            label: input.label,
            handle: input.handle,
            accessStartTime: input.accessStartTime,
            accessEndTime: input.accessEndTime,
            createdByOauthClientId: input.oauthClientId,
            externalRef: null,
          })
          .returning({ id: s.cohort.id })
          .then(singleRow);

        return { id: row.id, created: true };
      });
    },
  ),
);

export const apiListCohorts = wrapQuery(
  "cohort.api.listCohorts",
  withZod(
    z.object({
      locationId: uuidSchema,
      limit: z.number().int().positive().max(100).default(50),
      offset: z.number().int().nonnegative().default(0),
    }),
    z.object({
      items: cohortSelectSchema.array(),
      count: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative(),
    }),
    async (input) => {
      const query = useQuery();

      const items = await query
        .select()
        .from(s.cohort)
        .where(
          and(
            eq(s.cohort.locationId, input.locationId),
            isNull(s.cohort.deletedAt),
          ),
        )
        .orderBy(asc(s.cohort.accessStartTime), asc(s.cohort.accessEndTime))
        .limit(input.limit)
        .offset(input.offset);

      return {
        items,
        count: items.length,
        limit: input.limit,
        offset: input.offset,
      };
    },
  ),
);

export const apiGetCohort = wrapQuery(
  "cohort.api.getCohort",
  withZod(
    z.object({ cohortId: uuidSchema, locationId: uuidSchema }),
    cohortSelectSchema.nullable(),
    async (input) => {
      const query = useQuery();

      const row = await query
        .select()
        .from(s.cohort)
        .where(
          and(
            eq(s.cohort.id, input.cohortId),
            eq(s.cohort.locationId, input.locationId),
            isNull(s.cohort.deletedAt),
          ),
        )
        .limit(1)
        .then(possibleSingleRow);
      return row ?? null;
    },
  ),
);

export const apiAddStudent = wrapCommand(
  "cohort.api.addStudent",
  withZod(
    z.object({
      cohortId: uuidSchema,
      personId: uuidSchema,
      oauthClientId: uuidSchema,
      vaarschoolId: uuidSchema,
      tags: z.array(z.string()).optional(),
      externalRef: externalRefSchema.optional(),
    }),
    z.object({
      id: uuidSchema,
      created: z.boolean(),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        // 1. Verify cohort belongs to authorized vaarschool
        const cohort = await tx
          .select({ id: s.cohort.id, locationId: s.cohort.locationId })
          .from(s.cohort)
          .where(
            and(
              eq(s.cohort.id, input.cohortId),
              eq(s.cohort.locationId, input.vaarschoolId),
              isNull(s.cohort.deletedAt),
            ),
          )
          .limit(1)
          .then(possibleSingleRow);

        if (!cohort) {
          const error = new Error("cohort_not_found");
          (error as Error & { code: string }).code = "cohort_not_found";
          throw error;
        }

        // 2. Verify person is linked to vaarschool with status='linked'
        const link = await tx
          .select({ status: s.personLocationLink.status })
          .from(s.personLocationLink)
          .where(
            and(
              eq(s.personLocationLink.personId, input.personId),
              eq(s.personLocationLink.locationId, input.vaarschoolId),
            ),
          )
          .limit(1)
          .then(possibleSingleRow);

        if (!link || link.status !== "linked") {
          const error = new Error("person_not_linked");
          (error as Error & { code: string }).code = "person_not_linked";
          throw error;
        }

        // 3. Find or create student actor for (personId, locationId)
        const actor = await tx
          .insert(s.actor)
          .values({
            type: "student",
            personId: input.personId,
            locationId: input.vaarschoolId,
          })
          .onConflictDoUpdate({
            target: [s.actor.type, s.actor.personId, s.actor.locationId],
            set: { deletedAt: null },
          })
          .returning({ id: s.actor.id })
          .then(singleRow);

        // 4. Check if student already enrolled in cohort (regardless of external_ref)
        const existingAllocation = await tx
          .select({
            id: s.cohortAllocation.id,
            createdByOauthClientId: s.cohortAllocation.createdByOauthClientId,
          })
          .from(s.cohortAllocation)
          .where(
            and(
              eq(s.cohortAllocation.cohortId, input.cohortId),
              eq(s.cohortAllocation.actorId, actor.id),
              isNull(s.cohortAllocation.deletedAt),
            ),
          )
          .limit(1)
          .then(possibleSingleRow);

        if (existingAllocation) {
          // Only annotate the externalRef if THIS client owns the allocation.
          // Never reassign ownership to another client.
          if (
            input.externalRef &&
            existingAllocation.createdByOauthClientId === input.oauthClientId
          ) {
            await tx
              .update(s.cohortAllocation)
              .set({ externalRef: input.externalRef })
              .where(eq(s.cohortAllocation.id, existingAllocation.id));
          }
          return { id: existingAllocation.id, created: false };
        }

        // 5. Insert allocation. When externalRef is set, use the partial unique
        // index as the conflict target so concurrent retries collapse to a
        // single row instead of failing with a 23505. xmax=0 → fresh insert.
        if (input.externalRef) {
          const row = await tx
            .insert(s.cohortAllocation)
            .values({
              cohortId: input.cohortId,
              actorId: actor.id,
              tags: input.tags ?? [],
              externalRef: input.externalRef,
              createdByOauthClientId: input.oauthClientId,
            })
            .onConflictDoUpdate({
              target: [
                s.cohortAllocation.cohortId,
                s.cohortAllocation.createdByOauthClientId,
                s.cohortAllocation.externalRef,
              ],
              targetWhere: sql`deleted_at IS NULL AND external_ref IS NOT NULL`,
              set: { externalRef: sql`EXCLUDED.external_ref` },
            })
            .returning({
              id: s.cohortAllocation.id,
              created: sql<boolean>`xmax = 0`,
            })
            .then(singleRow);

          return { id: row.id, created: row.created };
        }

        const row = await tx
          .insert(s.cohortAllocation)
          .values({
            cohortId: input.cohortId,
            actorId: actor.id,
            tags: input.tags ?? [],
            externalRef: null,
            createdByOauthClientId: input.oauthClientId,
          })
          .returning({ id: s.cohortAllocation.id })
          .then(singleRow);

        return { id: row.id, created: true };
      });
    },
  ),
);

export const apiRemoveStudent = wrapCommand(
  "cohort.api.removeStudent",
  withZod(
    z.object({
      cohortId: uuidSchema,
      allocationId: uuidSchema,
      oauthClientId: uuidSchema,
      vaarschoolId: uuidSchema,
    }),
    z.object({ removed: z.boolean() }),
    async (input) => {
      return withTransaction(async (tx) => {
        const allocation = await tx
          .select({
            id: s.cohortAllocation.id,
            cohortId: s.cohortAllocation.cohortId,
          })
          .from(s.cohortAllocation)
          .innerJoin(
            s.cohort,
            and(
              eq(s.cohort.id, s.cohortAllocation.cohortId),
              eq(s.cohort.locationId, input.vaarschoolId),
              isNull(s.cohort.deletedAt),
            ),
          )
          .where(
            and(
              eq(s.cohortAllocation.id, input.allocationId),
              eq(s.cohortAllocation.cohortId, input.cohortId),
              eq(
                s.cohortAllocation.createdByOauthClientId,
                input.oauthClientId,
              ),
              isNull(s.cohortAllocation.deletedAt),
            ),
          )
          .limit(1)
          .then(possibleSingleRow);

        if (!allocation) {
          return { removed: false };
        }

        await tx
          .update(s.cohortAllocation)
          .set({ deletedAt: sql`NOW()` })
          .where(eq(s.cohortAllocation.id, allocation.id));

        return { removed: true };
      });
    },
  ),
);

export const apiListStudents = wrapQuery(
  "cohort.api.listStudents",
  withZod(
    z.object({
      cohortId: uuidSchema,
      vaarschoolId: uuidSchema,
      limit: z.number().int().positive().max(200).default(100),
      offset: z.number().int().nonnegative().default(0),
    }),
    z.object({
      items: z.array(
        z.object({
          allocationId: uuidSchema,
          personId: uuidSchema,
          handle: z.string(),
          firstName: z.string().nullable(),
          lastNamePrefix: z.string().nullable(),
          lastName: z.string().nullable(),
          dateOfBirth: z.string().nullable(),
          tags: z.array(z.string()),
          externalRef: z.string().nullable(),
        }),
      ),
      count: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative(),
    }),
    async (input) => {
      const query = useQuery();

      const cohortRow = await query
        .select({ id: s.cohort.id })
        .from(s.cohort)
        .where(
          and(
            eq(s.cohort.id, input.cohortId),
            eq(s.cohort.locationId, input.vaarschoolId),
            isNull(s.cohort.deletedAt),
          ),
        )
        .limit(1)
        .then(possibleSingleRow);

      if (!cohortRow) {
        return { items: [], count: 0, limit: input.limit, offset: input.offset };
      }

      const rows = await query
        .select({
          allocationId: s.cohortAllocation.id,
          personId: s.person.id,
          handle: s.person.handle,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
          dateOfBirth: s.person.dateOfBirth,
          tags: s.cohortAllocation.tags,
          externalRef: s.cohortAllocation.externalRef,
        })
        .from(s.cohortAllocation)
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.id, s.cohortAllocation.actorId),
            eq(s.actor.type, "student"),
            isNull(s.actor.deletedAt),
          ),
        )
        .innerJoin(s.person, eq(s.person.id, s.actor.personId))
        .where(
          and(
            eq(s.cohortAllocation.cohortId, input.cohortId),
            isNull(s.cohortAllocation.deletedAt),
            isNull(s.person.deletedAt),
          ),
        )
        .orderBy(asc(s.person.lastName), asc(s.person.firstName))
        .limit(input.limit)
        .offset(input.offset);

      return {
        items: rows.map((row) => ({
          ...row,
          handle: row.handle ?? "",
          tags: row.tags ?? [],
        })),
        count: rows.length,
        limit: input.limit,
        offset: input.offset,
      };
    },
  ),
);
