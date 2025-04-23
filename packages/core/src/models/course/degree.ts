import { schema as s } from "@nawadi/db";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { insertSchema, selectSchema } from "./degree.schema.js";

export const create = wrapCommand(
  "course.degree.create",
  withZod(
    insertSchema.pick({
      title: true,
      handle: true,
      rang: true,
    }),
    successfulCreateResponse,
    async (item) => {
      const query = useQuery();

      const rows = await query
        .insert(s.degree)
        .values({
          title: item.title,
          handle: item.handle,
          rang: item.rang,
        })
        .returning({ id: s.degree.id });

      const row = singleRow(rows);
      return row;
    },
  ),
);

export const list = wrapQuery(
  "course.degree.list",
  withZod(z.void(), selectSchema.array(), async () => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.degree)
      .orderBy(asc(s.degree.rang));

    return rows;
  }),
);

export const fromHandle = wrapQuery(
  "course.degree.fromHandle",
  withZod(handleSchema, selectSchema.nullable(), async (handle) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.degree)
      .where(eq(s.degree.handle, handle));

    return possibleSingleRow(rows) ?? null;
  }),
);

export const fromId = wrapQuery(
  "course.degree.fromId",
  withZod(uuidSchema, selectSchema.nullable(), async (id) => {
    const query = useQuery();

    const rows = await query.select().from(s.degree).where(eq(s.degree.id, id));

    return possibleSingleRow(rows) ?? null;
  }),
);
