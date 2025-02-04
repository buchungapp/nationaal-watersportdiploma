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
} from "../../utils/index.js";
import { insertSchema, selectSchema } from "./competency.schema.js";

export const create = withZod(
  insertSchema.pick({
    title: true,
    handle: true,
    type: true,
  }),
  successfulCreateResponse,
  async (item) =>
    withTransaction(async (tx) => {
      const currentHeighestWeight = await tx
        .select({ weight: s.competency.weight })
        .from(s.competency)
        .orderBy(desc(s.competency.weight))
        .limit(1)
        .then((rows) => rows[0]?.weight ?? 0);

      const rows = await tx
        .insert(s.competency)
        .values({
          title: item.title,
          handle: item.handle,
          type: item.type,
          weight: currentHeighestWeight + 1,
        })
        .returning({ id: s.competency.id });

      const row = singleRow(rows);
      return row;
    }),
);

export const list = withZod(z.void(), selectSchema.array(), async () => {
  const query = useQuery();

  const rows = await query
    .select()
    .from(s.competency)
    .orderBy(asc(s.competency.weight));

  return rows;
});

export const fromHandle = withZod(
  handleSchema,
  selectSchema.nullable(),
  async (handle) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.competency)
      .where(eq(s.competency.handle, handle));

    return possibleSingleRow(rows) ?? null;
  },
);
