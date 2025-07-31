import { schema as s } from "@nawadi/db";
import {
  type SQL,
  and,
  asc,
  eq,
  exists,
  inArray,
  isNull,
  notInArray,
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
import { insertSchema, selectSchema } from "./gear-type.schema.js";

export const create = wrapCommand(
  "curriculum.gear-type.create",
  withZod(
    insertSchema.pick({
      title: true,
      handle: true,
    }),
    successfulCreateResponse,
    async (item) =>
      withTransaction(async (tx) => {
        const rows = await tx
          .insert(s.gearType)
          .values({
            title: item.title,
            handle: item.handle,
          })
          .returning({ id: s.gearType.id });

        const row = singleRow(rows);
        return row;
      }),
  ),
);

export const list = wrapQuery(
  "curriculum.gear-type.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            id: singleOrArray(uuidSchema).optional(),
            handle: singleOrArray(handleSchema).optional(),
            curriculumId: singleOrArray(uuidSchema).optional(),
            locationId: singleOrArray(uuidSchema).optional(),
          })
          .default({}),
      })
      .default({}),
    selectSchema.array(),
    async ({ filter }) => {
      const query = useQuery();
      const whereClauses: (SQL | undefined)[] = [
        filter.id
          ? Array.isArray(filter.id)
            ? inArray(s.gearType.id, filter.id)
            : eq(s.gearType.id, filter.id)
          : undefined,
        filter.handle
          ? Array.isArray(filter.handle)
            ? inArray(s.gearType.handle, filter.handle)
            : eq(s.gearType.handle, filter.handle)
          : undefined,
        filter.curriculumId
          ? exists(
              query
                .select()
                .from(s.curriculumGearLink)
                .where(
                  and(
                    isNull(s.curriculumGearLink.deletedAt),
                    eq(s.curriculumGearLink.gearTypeId, s.gearType.id),
                    Array.isArray(filter.curriculumId)
                      ? inArray(
                          s.curriculumGearLink.curriculumId,
                          filter.curriculumId,
                        )
                      : eq(
                          s.curriculumGearLink.curriculumId,
                          filter.curriculumId,
                        ),
                  ),
                ),
            )
          : undefined,
        filter.locationId
          ? exists(
              query
                .select()
                .from(s.locationResourceLink)
                .where(
                  and(
                    isNull(s.locationResourceLink.deletedAt),
                    eq(s.locationResourceLink.gearTypeId, s.gearType.id),
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
        .from(s.gearType)
        .where(and(...whereClauses))
        .orderBy(asc(s.gearType.title));

      return rows;
    },
  ),
);

export const update = wrapCommand(
  "curriculum.gear-type.update",
  withZod(
    insertSchema.pick({ title: true }).extend({ id: uuidSchema }),
    z.void(),
    async (input) => {
      const query = useQuery();
      await query
        .update(s.gearType)
        .set({ title: input.title })
        .where(eq(s.gearType.id, input.id));
    },
  ),
);

export const fromHandle = wrapQuery(
  "curriculum.gear-type.fromHandle",
  withZod(handleSchema, selectSchema.nullable(), async (handle) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.gearType)
      .where(eq(s.gearType.handle, handle));

    return possibleSingleRow(rows) ?? null;
  }),
);

export const fromId = wrapQuery(
  "curriculum.gear-type.fromId",
  withZod(uuidSchema, selectSchema.nullable(), async (id) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.gearType)
      .where(eq(s.gearType.id, id));

    return possibleSingleRow(rows) ?? null;
  }),
);

export const linkToCurriculum = wrapCommand(
  "curriculum.gear-type.linkToCurriculum",
  withZod(
    z.object({
      gearTypeId: z.string(),
      curriculumId: z.string(),
    }),
    z.void(),
    async (input) => {
      const query = useQuery();

      await query
        .insert(s.curriculumGearLink)
        .values({
          gearTypeId: input.gearTypeId,
          curriculumId: input.curriculumId,
        })
        .onConflictDoNothing({
          target: [
            s.curriculumGearLink.gearTypeId,
            s.curriculumGearLink.curriculumId,
          ],
        });
    },
  ),
);

export const updateCurricula = wrapCommand(
  "curriculum.gear-type.updateCurricula",
  withZod(
    z.object({
      gearTypeId: uuidSchema,
      curriculumIds: z.array(uuidSchema),
    }),
    async ({ gearTypeId, curriculumIds }) => {
      const query = useQuery();

      await Promise.all([
        query
          .delete(s.curriculumGearLink)
          .where(
            and(
              eq(s.curriculumGearLink.gearTypeId, gearTypeId),
              notInArray(s.curriculumGearLink.curriculumId, curriculumIds),
            ),
          ),
        query
          .insert(s.curriculumGearLink)
          .values(
            curriculumIds.map((curriculumId) => ({
              gearTypeId,
              curriculumId,
            })),
          )
          .onConflictDoNothing({
            target: [
              s.curriculumGearLink.gearTypeId,
              s.curriculumGearLink.curriculumId,
            ],
          }),
      ]);
    },
  ),
);
