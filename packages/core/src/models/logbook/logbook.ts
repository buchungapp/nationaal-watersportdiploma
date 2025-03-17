import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from "../../utils/index.js";
import { logbookSchema } from "./logbook.schema.js";

export const byId = withZod(
  z.object({
    id: uuidSchema,
  }),
  logbookSchema,
  async (input) => {
    const query = useQuery();

    const logbook = await query
      .select()
      .from(s.logbook)
      .where(and(eq(s.logbook.id, input.id), isNull(s.logbook.deletedAt)))
      .then(singleRow);

    return {
      ...logbook,
      createdAt: dayjs(logbook.createdAt).toISOString(),
      startedAt: dayjs(logbook.startedAt).toISOString(),
      endedAt: logbook.endedAt ? dayjs(logbook.endedAt).toISOString() : null,
      boatLength: logbook.boatLength ? Number(logbook.boatLength) : null,
      sailedNauticalMiles: logbook.sailedNauticalMiles
        ? Number(logbook.sailedNauticalMiles)
        : null,
      sailedHoursInDark: logbook.sailedHoursInDark
        ? Number(logbook.sailedHoursInDark)
        : null,
    };
  },
);

export const listForPerson = withZod(
  z.object({
    personId: uuidSchema,
  }),
  logbookSchema.array(),
  async (input) => {
    const query = useQuery();

    const logbooks = await query
      .select()
      .from(s.logbook)
      .where(
        and(
          eq(s.logbook.personId, input.personId),
          isNull(s.logbook.deletedAt),
        ),
      )
      .orderBy(desc(s.logbook.startedAt), desc(s.logbook.createdAt));

    return logbooks.map((logbook) => ({
      ...logbook,
      createdAt: dayjs(logbook.createdAt).toISOString(),
      startedAt: dayjs(logbook.startedAt).toISOString(),
      endedAt: logbook.endedAt ? dayjs(logbook.endedAt).toISOString() : null,
      boatLength: logbook.boatLength ? Number(logbook.boatLength) : null,
      sailedNauticalMiles: logbook.sailedNauticalMiles
        ? Number(logbook.sailedNauticalMiles)
        : null,
      sailedHoursInDark: logbook.sailedHoursInDark
        ? Number(logbook.sailedHoursInDark)
        : null,
    }));
  },
);

export const create = withZod(
  logbookSchema.omit({ id: true, createdAt: true }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery();

    const rows = await query
      .insert(s.logbook)
      .values({
        ...input,
        boatLength: input.boatLength?.toString(),
        sailedNauticalMiles: input.sailedNauticalMiles?.toString(),
        sailedHoursInDark: input.sailedHoursInDark?.toString(),
      })
      .returning({
        id: s.logbook.id,
      });

    return singleRow(rows);
  },
);

export const update = withZod(
  z.object({
    id: uuidSchema,
    startedAt: z.string().datetime().optional(),
    endedAt: z.string().datetime().nullable().optional(),
    departurePort: z.string().nullable().optional(),
    arrivalPort: z.string().nullable().optional(),
    windPower: z.number().nullable().optional(),
    windDirection: z.string().nullable().optional(),
    boatType: z.string().nullable().optional(),
    boatLength: z.number().nullable().optional(),
    location: z.string().nullable().optional(),
    sailedNauticalMiles: z.number().nullable().optional(),
    sailedHoursInDark: z.number().nullable().optional(),
    primaryRole: z.string().nullable().optional(),
    crewNames: z.string().nullable().optional(),
    conditions: z.string().nullable().optional(),
    additionalComments: z.string().nullable().optional(),
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery();

    const row = await query
      .update(s.logbook)
      .set({
        ...input,
        boatLength: input.boatLength?.toString(),
        sailedNauticalMiles: input.sailedNauticalMiles?.toString(),
        sailedHoursInDark: input.sailedHoursInDark?.toString(),
      })
      .where(and(eq(s.logbook.id, input.id), isNull(s.logbook.deletedAt)))
      .returning({ id: s.logbook.id })
      .then(singleRow);

    return row;
  },
);

export const remove = withZod(uuidSchema, z.void(), async (input) => {
  const query = useQuery();

  await query
    .update(s.logbook)
    .set({
      deletedAt: sql`NOW()`,
    })
    .where(and(eq(s.logbook.id, input)));
});
