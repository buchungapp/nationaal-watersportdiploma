import { schema as s } from "@nawadi/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../main.js";
import { singleRow } from "../../utils/data-helpers.js";
import { successfulCreateResponse, withZod } from "../../utils/zod.js";

const cashbackSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  postalCode: z.string(),
  city: z.string(),
  verificationMediaId: z.string().uuid(),
  verificationLocation: z.string(),
  bookingLocationId: z.string().uuid(),
  bookingNumber: z.string(),
  iban: z.string(),
});

export const create = withZod(
  cashbackSchema,
  successfulCreateResponse,
  async (input) => {
    const query = useQuery();

    const rows = await query.insert(s.cashback).values(input).returning({
      id: s.cashback.id,
    });

    return singleRow(rows);
  },
);

export const byId = withZod(
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
);

export const listAll = withZod(z.void(), cashbackSchema.array(), async () => {
  const query = useQuery();

  const cashbacks = await query
    .select()
    .from(s.cashback)
    .orderBy(desc(s.cashback.createdAt));

  return cashbacks;
});
