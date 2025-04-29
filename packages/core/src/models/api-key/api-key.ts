import { schema as s } from "@nawadi/db";
import { invariant } from "@nawadi/lib";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { hashToken } from "../../utils/crypto.js";
import {
  singleRow,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

export const createForUser = wrapCommand(
  "apiKey.createForUser",
  withZod(
    z.object({
      name: z.string(),
      userId: z.string(),
    }),
    z.object({
      id: z.string(),
      token: z.string(),
    }),
    async (input) => {
      const query = useQuery();
      const token = nanoid(24);

      const hashedKey = hashToken(token);
      // take first 2 and last 4 characters of the key
      const partialKey = `${token.slice(0, 2)}...${token.slice(-4)}`;

      const row = await query
        .insert(s.token)
        .values({
          hashedKey,
          partialKey,
          name: input.name,
          userId: input.userId,
        })
        .returning({ id: s.token.id })
        .then(singleRow);

      return { id: row.id, token };
    },
  ),
);

export const byToken = wrapQuery(
  "apiKey.byToken",
  withZod(
    z.string(),
    z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      locationId: z.string().uuid().nullable(),
    }),
    async (token) => {
      const query = useQuery();

      const hashedKey = hashToken(token);

      const row = await query
        .select()
        .from(s.token)
        .where(
          and(
            eq(s.token.hashedKey, hashedKey),
            isNull(s.token.deletedAt),
            or(
              isNull(s.token.expires),
              lte(s.token.expires, new Date().toISOString()),
            ),
          ),
        )
        .then(singleRow);

      const userId = row.userId;
      invariant(userId, "Unassociated tokens are not supported at this time.");

      await query
        .insert(s.tokenUsage)
        .values({ tokenId: row.id, usedAt: new Date().toISOString() });

      return { userId, id: row.id, locationId: row.locationId };
    },
  ),
);
