import { schema as s } from "@nawadi/db";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  singleRow,
  uuidSchema,
  withLimitOffset,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

export type CreatePvbAanvraagInput = {
  kandidaatId: string;
  type:
    | "instructeur_1"
    | "instructeur_2"
    | "instructeur_3"
    | "instructeur_4"
    | "leercoach_4"
    | "pvb_beoordelaar_4"
    | "pvb_beoordelaar_5";
  hoofdcursusId?: string;
  leercoachId?: string;
  beoordelaarId?: string;
  aanvangsdatum?: Date;
  aanvangstijd?: string;
  opmerkingen?: string;
  kwalificatieprofielen?: string[];
};

async function generateHandle(
  kandidaatId: string,
  type: string,
): Promise<string> {
  const query = useQuery();
  const baseHandle = `${type}-${kandidaatId.slice(-8)}`;
  let handle = baseHandle;
  let counter = 1;

  while (true) {
    const existing = await query
      .select({ id: s.pvbAanvraagTable.id })
      .from(s.pvbAanvraagTable)
      .where(eq(s.pvbAanvraagTable.handle, handle))
      .limit(1);

    if (existing.length === 0) {
      return handle;
    }

    handle = `${baseHandle}-${counter}`;
    counter++;
  }
}

export const list = wrapQuery(
  "pvb.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            locationId: z.string().optional(),
            q: z.string().optional(),
            status: z.array(z.string()).optional(),
            type: z.array(z.string()).optional(),
          })
          .default({}),
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
      .default({}),
    async ({ filter, limit, offset }) => {
      const query = useQuery();

      const whereConditions = [];

      if (filter.locationId) {
        whereConditions.push(eq(s.actor.locationId, filter.locationId));
      }

      if (filter.status && filter.status.length > 0) {
        whereConditions.push(
          sql`${s.pvbAanvraagTable.status} = ANY(${filter.status})`,
        );
      }

      if (filter.type && filter.type.length > 0) {
        whereConditions.push(
          sql`${s.pvbAanvraagTable.type} = ANY(${filter.type})`,
        );
      }

      if (filter.q) {
        const searchTerm = `%${filter.q}%`;
        whereConditions.push(
          or(
            like(s.person.firstName, searchTerm),
            like(s.person.lastName, searchTerm),
            like(s.pvbAanvraagTable.handle, searchTerm),
            like(s.pvbAanvraagTable.opmerkingen, searchTerm),
          ),
        );
      }

      const baseQuery = query
        .select({
          pvb: s.pvbAanvraagTable,
          kandidaat: {
            id: s.person.id,
            firstName: s.person.firstName,
            lastNamePrefix: s.person.lastNamePrefix,
            lastName: s.person.lastName,
          },
        })
        .from(s.pvbAanvraagTable)
        .innerJoin(s.actor, eq(s.pvbAanvraagTable.kandidaatId, s.actor.id))
        .innerJoin(s.person, eq(s.actor.personId, s.person.id))
        .where(and(...whereConditions))
        .orderBy(desc(s.pvbAanvraagTable.createdAt));

      const [items, totalCountResult] = await Promise.all([
        withLimitOffset(baseQuery, limit, offset),
        query
          .select({ count: sql<number>`count(*)` })
          .from(s.pvbAanvraagTable)
          .innerJoin(s.actor, eq(s.pvbAanvraagTable.kandidaatId, s.actor.id))
          .innerJoin(s.person, eq(s.actor.personId, s.person.id))
          .where(and(...whereConditions))
          .then(singleRow),
      ]);

      // Get additional data for each item
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          const [leercoach, beoordelaar, hoofdcursus] = await Promise.all([
            item.pvb.leercoachId
              ? query
                  .select({
                    id: s.person.id,
                    firstName: s.person.firstName,
                    lastNamePrefix: s.person.lastNamePrefix,
                    lastName: s.person.lastName,
                  })
                  .from(s.actor)
                  .innerJoin(s.person, eq(s.actor.personId, s.person.id))
                  .where(eq(s.actor.id, item.pvb.leercoachId))
                  .limit(1)
                  .then((result) => result[0])
              : null,
            item.pvb.beoordelaarId
              ? query
                  .select({
                    id: s.person.id,
                    firstName: s.person.firstName,
                    lastNamePrefix: s.person.lastNamePrefix,
                    lastName: s.person.lastName,
                  })
                  .from(s.actor)
                  .innerJoin(s.person, eq(s.actor.personId, s.person.id))
                  .where(eq(s.actor.id, item.pvb.beoordelaarId))
                  .limit(1)
                  .then((result) => result[0])
              : null,
            item.pvb.hoofdcursusId
              ? query
                  .select({
                    id: s.curriculum.id,
                    program: {
                      id: s.program.id,
                      title: s.program.title,
                      course: {
                        id: s.course.id,
                        title: s.course.title,
                      },
                    },
                  })
                  .from(s.curriculum)
                  .innerJoin(
                    s.program,
                    eq(s.curriculum.programId, s.program.id),
                  )
                  .innerJoin(s.course, eq(s.program.courseId, s.course.id))
                  .where(eq(s.curriculum.id, item.pvb.hoofdcursusId))
                  .limit(1)
                  .then((result) => result[0])
              : null,
          ]);

          return {
            ...item.pvb,
            kandidaat: item.kandidaat,
            leercoach: leercoach || undefined,
            beoordelaar: beoordelaar || undefined,
            hoofdcursus: hoofdcursus || undefined,
          };
        }),
      );

      return {
        items: enrichedItems,
        totalCount: totalCountResult.count,
      };
    },
  ),
);

export const create = wrapCommand(
  "pvb.create",
  withZod(
    z.object({
      kandidaatId: uuidSchema,
      type: z.enum([
        "instructeur_1",
        "instructeur_2",
        "instructeur_3",
        "instructeur_4",
        "leercoach_4",
        "pvb_beoordelaar_4",
        "pvb_beoordelaar_5",
      ]),
      hoofdcursusId: uuidSchema.optional(),
      leercoachId: uuidSchema.optional(),
      beoordelaarId: uuidSchema.optional(),
      aanvangsdatum: z.string().datetime().optional(),
      aanvangstijd: z.string().optional(),
      opmerkingen: z.string().optional(),
      kwalificatieprofielen: z.array(z.string()).default([]),
    }),
    async (input) => {
      const query = useQuery();

      const handle = await generateHandle(input.kandidaatId, input.type);

      const [pvbAanvraag] = await query
        .insert(s.pvbAanvraagTable)
        .values({
          handle,
          kandidaatId: input.kandidaatId,
          type: input.type,
          hoofdcursusId: input.hoofdcursusId,
          leercoachId: input.leercoachId,
          beoordelaarId: input.beoordelaarId,
          aanvangsdatum: input.aanvangsdatum,
          aanvangstijd: input.aanvangstijd,
          opmerkingen: input.opmerkingen,
          kwalificatieprofielen: input.kwalificatieprofielen,
          status: "concept",
        })
        .returning();

      if (!pvbAanvraag) {
        throw new Error("Failed to create PVB aanvraag");
      }

      return pvbAanvraag;
    },
  ),
);

export const update = wrapCommand(
  "pvb.update",
  withZod(
    z.object({
      id: uuidSchema,
      hoofdcursusId: uuidSchema.optional(),
      leercoachId: uuidSchema.optional(),
      beoordelaarId: uuidSchema.optional(),
      aanvangsdatum: z.string().datetime().optional(),
      aanvangstijd: z.string().optional(),
      opmerkingen: z.string().optional(),
      kwalificatieprofielen: z.array(z.string()).optional(),
      status: z
        .enum([
          "concept",
          "wacht_op_voorwaarden",
          "gepland",
          "uitgevoerd",
          "geslaagd",
          "gezakt",
          "geannuleerd",
        ])
        .optional(),
    }),
    async (input) => {
      const query = useQuery();

      const [pvbAanvraag] = await query
        .update(s.pvbAanvraagTable)
        .set({
          hoofdcursusId: input.hoofdcursusId,
          leercoachId: input.leercoachId,
          beoordelaarId: input.beoordelaarId,
          aanvangsdatum: input.aanvangsdatum,
          aanvangstijd: input.aanvangstijd,
          opmerkingen: input.opmerkingen,
          kwalificatieprofielen: input.kwalificatieprofielen,
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(s.pvbAanvraagTable.id, input.id))
        .returning();

      if (!pvbAanvraag) {
        throw new Error("PVB aanvraag not found");
      }

      return pvbAanvraag;
    },
  ),
);

export const byId = wrapQuery(
  "pvb.byId",
  withZod(uuidSchema, async (id) => {
    const query = useQuery();

    const [pvbAanvraag] = await query
      .select()
      .from(s.pvbAanvraagTable)
      .where(eq(s.pvbAanvraagTable.id, id))
      .limit(1);

    return pvbAanvraag || null;
  }),
);

export const byHandle = wrapQuery(
  "pvb.byHandle",
  withZod(z.string(), async (handle) => {
    const query = useQuery();

    const [pvbAanvraag] = await query
      .select()
      .from(s.pvbAanvraagTable)
      .where(eq(s.pvbAanvraagTable.handle, handle))
      .limit(1);

    return pvbAanvraag || null;
  }),
);

export const remove = wrapCommand(
  "pvb.remove",
  withZod(uuidSchema, async (id) => {
    const query = useQuery();

    await query.delete(s.pvbAanvraagTable).where(eq(s.pvbAanvraagTable.id, id));
  }),
);

export const kickOffAanvraag = wrapCommand(
  "pvb.kickOffAanvraag",
  withZod(uuidSchema, async (id) => {
    const query = useQuery();

    const pvbAanvraag = await byId(id);

    if (!pvbAanvraag) {
      throw new Error("PVB aanvraag not found");
    }

    if (pvbAanvraag.status !== "concept") {
      throw new Error("Can only kick off PVB aanvragen in concept status");
    }

    // Move to wacht_op_voorwaarden and check if we can proceed further
    let newStatus = "wacht_op_voorwaarden";

    // Check if all prerequisites are met to move to next status
    if (
      pvbAanvraag.hoofdcursusId &&
      pvbAanvraag.beoordelaarId &&
      pvbAanvraag.aanvangsdatum
    ) {
      newStatus = "gepland";
    }

    return await update({
      id,
      status: newStatus as any,
    });
  }),
);

export const cancel = wrapCommand(
  "pvb.cancel",
  withZod(uuidSchema, async (id) => {
    return await update({
      id,
      status: "geannuleerd",
    });
  }),
);

export const bulkUpdateAanvangsdatum = wrapCommand(
  "pvb.bulkUpdateAanvangsdatum",
  withZod(
    z.object({
      ids: z.array(uuidSchema),
      aanvangsdatum: z.string().datetime(),
      aanvangstijd: z.string().optional(),
    }),
    async ({ ids, aanvangsdatum, aanvangstijd }) => {
      const query = useQuery();

      await query
        .update(s.pvbAanvraagTable)
        .set({
          aanvangsdatum,
          aanvangstijd,
          updatedAt: new Date(),
        })
        .where(sql`${s.pvbAanvraagTable.id} = ANY(${ids})`);
    },
  ),
);

export const bulkUpdateLeercoach = wrapCommand(
  "pvb.bulkUpdateLeercoach",
  withZod(
    z.object({
      ids: z.array(uuidSchema),
      leercoachId: uuidSchema.nullable(),
    }),
    async ({ ids, leercoachId }) => {
      const query = useQuery();

      await query
        .update(s.pvbAanvraagTable)
        .set({
          leercoachId,
          updatedAt: new Date(),
        })
        .where(sql`${s.pvbAanvraagTable.id} = ANY(${ids})`);
    },
  ),
);
