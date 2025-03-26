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
import { insertSchema, selectSchema } from "./module.schema.js";

export const create = withZod(
  insertSchema.pick({
    title: true,
    handle: true,
    weight: true,
  }),
  successfulCreateResponse,
  async (item) =>
    withTransaction(async (tx) => {
      if (item.weight === undefined) {
        const currentHeighestWeight = await tx
          .select({ weight: s.module.weight })
          .from(s.module)
          .orderBy(desc(s.module.weight))
          .limit(1)
          .then((rows) => rows[0]?.weight ?? 0);

        item.weight = currentHeighestWeight + 1;
      }

      const rows = await tx
        .insert(s.module)
        .values({
          title: item.title,
          handle: item.handle,
          weight: item.weight,
        })
        .returning({ id: s.module.id });

      const row = singleRow(rows);
      return row;
    }),
);

export const list = withZod(z.void(), selectSchema.array(), async () => {
  const query = useQuery();

  const rows = await query
    .select()
    .from(s.module)
    .orderBy(asc(s.module.weight));

  return rows;
});

export const fromHandle = withZod(
  handleSchema,
  selectSchema.nullable(),
  async (handle) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.module)
      .where(eq(s.module.handle, handle));

    return possibleSingleRow(rows) ?? null;
  },
);
