import { schema as s } from "@nawadi/db";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  successfulCreateResponse,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { insertSchema, selectSchema } from "./competency.schema.js";

export const create = wrapCommand(
  "course.competency.create",
  withZod(
    insertSchema
      .pick({
        title: true,
        handle: true,
        type: true,
      })
      .extend({
        weight: insertSchema.shape.weight.optional(),
      }),
    successfulCreateResponse,
    async (item) =>
      withTransaction(async (tx) => {
        let weight = item.weight;

        if (!weight) {
          const currentHeighestWeight = await tx
            .select({ weight: s.competency.weight })
            .from(s.competency)
            .orderBy(desc(s.competency.weight))
            .limit(1)
            .then((rows) => rows[0]?.weight ?? 0);

          weight = currentHeighestWeight + 1;
        }

        const rows = await tx
          .insert(s.competency)
          .values({
            title: item.title,
            handle: item.handle,
            type: item.type,
            weight,
          })
          .returning({ id: s.competency.id });

        const row = singleRow(rows);
        return row;
      }),
  ),
);

export const list = wrapQuery(
  "course.competency.list",
  withZod(z.void(), selectSchema.array(), async () => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.competency)
      .orderBy(asc(s.competency.weight));

    return rows;
  }),
);

export const fromHandle = wrapQuery(
  "course.competency.fromHandle",
  withZod(handleSchema, selectSchema.nullable(), async (handle) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.competency)
      .where(eq(s.competency.handle, handle));

    return possibleSingleRow(rows) ?? null;
  }),
);
