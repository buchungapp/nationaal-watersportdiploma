import { schema as s } from "@nawadi/db";
import {
  type SQL,
  and,
  asc,
  desc,
  eq,
  exists,
  inArray,
  isNull,
} from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  handleSchema,
  possibleSingleRow,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { insertSchema, selectSchema } from "./discipline.schema.js";

export const create = wrapCommand(
  "course.discipline.create",
  withZod(
    insertSchema
      .pick({
        title: true,
        handle: true,
      })
      .extend({
        weight: insertSchema.shape.weight.optional(),
      }),
    successfulCreateResponse,
    async (item) =>
      withTransaction(async (tx) => {
        let currentWeight = item.weight;
        if (!currentWeight) {
          const currentHighestWeight = await tx
            .select({ weight: s.discipline.weight })
            .from(s.discipline)
            .orderBy(desc(s.discipline.weight))
            .limit(1)
            .then((rows) => rows[0]?.weight ?? 0);

          currentWeight = currentHighestWeight + 1;
        }

        const rows = await tx
          .insert(s.discipline)
          .values({
            title: item.title,
            handle: item.handle,
            weight: currentWeight,
          })
          .returning({ id: s.discipline.id });

        const row = singleRow(rows);
        return row;
      }),
  ),
);

export const update = wrapCommand(
  "course.discipline.update",
  withZod(
    z.object({
      id: uuidSchema,
      title: insertSchema.shape.title.optional(),
      weight: insertSchema.shape.weight.optional(),
    }),
    z.void(),
    async (input) => {
      const query = useQuery();
      await query
        .update(s.discipline)
        .set({ title: input.title, weight: input.weight })
        .where(eq(s.discipline.id, input.id));
    },
  ),
);

export const list = wrapQuery(
  "course.discipline.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            locationId: singleOrArray(uuidSchema).optional(),
          })
          .default({}),
      })
      .default({}),
    selectSchema.array(),
    async ({ filter }) => {
      const query = useQuery();

      const whereClauses: (SQL | undefined)[] = [
        filter.locationId
          ? exists(
              query
                .select()
                .from(s.locationResourceLink)
                .where(
                  and(
                    isNull(s.locationResourceLink.deletedAt),
                    eq(s.locationResourceLink.disciplineId, s.discipline.id),
                    Array.isArray(filter.locationId)
                      ? inArray(
                          s.locationResourceLink.locationId,
                          filter.locationId,
                        )
                      : eq(
                          s.locationResourceLink.locationId,
                          filter.locationId,
                        ),
                  ),
                ),
            )
          : undefined,
      ];

      const rows = await query
        .select()
        .from(s.discipline)
        .where(and(...whereClauses))
        .orderBy(asc(s.discipline.weight));

      return rows;
    },
  ),
);

export const fromHandle = wrapQuery(
  "course.discipline.fromHandle",
  withZod(handleSchema, selectSchema.nullable(), async (handle) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.discipline)
      .where(eq(s.discipline.handle, handle));

    return possibleSingleRow(rows) ?? null;
  }),
);

export const fromId = wrapQuery(
  "course.discipline.fromId",
  withZod(uuidSchema, selectSchema.nullable(), async (id) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.discipline)
      .where(eq(s.discipline.id, id));

    return possibleSingleRow(rows) ?? null;
  }),
);
