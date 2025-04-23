import { schema as s } from "@nawadi/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../main.js";
import { singleRow } from "../../utils/data-helpers.js";
import {
  successfulCreateResponse,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

const cashbackSchema = z.object({
  applicantFullName: z.string(),
  applicantEmail: z.string().email(),
  studentFullName: z.string(),
  verificationMediaId: z.string().uuid(),
  verificationLocation: z.string(),
  bookingLocationId: z.string().uuid(),
  bookingNumber: z.string(),
  applicantIban: z.string(),
});

export const create = wrapCommand(
  "marketing.cashback.create",
  withZod(cashbackSchema, successfulCreateResponse, async (input) => {
    const query = useQuery();

    const rows = await query.insert(s.cashback).values(input).returning({
      id: s.cashback.id,
    });

    return singleRow(rows);
  }),
);

export const byId = wrapQuery(
  "marketing.cashback.byId",
  withZod(
    z.object({
      id: z.string().uuid(),
    }),
    cashbackSchema,
    async (input) => {
      const query = useQuery();

      const cashback = await query
        .select()
        .from(s.cashback)
        .where(eq(s.cashback.id, input.id))
        .then(singleRow);

      return cashback;
    },
  ),
);

export const listAll = wrapQuery(
  "marketing.cashback.listAll",
  withZod(z.void(), cashbackSchema.array(), async () => {
    const query = useQuery();

    const cashbacks = await query
      .select()
      .from(s.cashback)
      .orderBy(desc(s.cashback.createdAt));

    return cashbacks;
  }),
);
