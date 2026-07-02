import { schema as s } from "@nawadi/db";
import { and, eq, exists, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { useQuery } from "../../contexts/index.ts";
import { hashToken } from "../../utils/crypto.ts";
import {
  possibleSingleRow,
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.ts";

const activeApiKeyCondition = () =>
  and(
    isNull(s.token.deletedAt),
    or(isNull(s.token.expires), gt(s.token.expires, new Date().toISOString())),
  );

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
    z
      .object({
        id: z.string(),
        userId: z.string(),
      })
      .optional(),
    async (token) => {
      const query = useQuery();

      const hashedKey = hashToken(token);

      const row = await query
        .select()
        .from(s.token)
        .where(and(eq(s.token.hashedKey, hashedKey), activeApiKeyCondition()))
        .then(possibleSingleRow);

      if (row != null && row.userId === null) {
        throw new Error("Unassociated tokens are not supported at this time.");
      }

      return row as { id: string; userId: string };
    },
  ),
);

/**
 * Bridge authorization predicate for today's user-bound API keys.
 *
 * This intentionally treats a token as authorized only when it has the named
 * token privilege and its owning user has an active location actor/link. It is
 * not the final vendor identity model; external rollout should move to
 * explicit vendor/client tokens that are bound to locations directly.
 */
export const userBoundApiKeyHasPrivilegeForLocation = wrapQuery(
  "apiKey.userBoundApiKeyHasPrivilegeForLocation",
  withZod(
    z.object({
      apiKeyId: uuidSchema,
      privilegeHandle: z.string().trim().min(1),
      locationId: uuidSchema,
      actorTypes: z
        .array(z.enum(["location_admin", "instructor", "student"]))
        .nonempty()
        .default(["location_admin"]),
    }),
    z.boolean(),
    async (input) => {
      const query = useQuery();

      const rows = await query
        .select({ id: s.token.id })
        .from(s.token)
        .innerJoin(
          s.tokenPrivilege,
          and(
            eq(s.tokenPrivilege.tokenId, s.token.id),
            isNull(s.tokenPrivilege.deletedAt),
          ),
        )
        .innerJoin(
          s.privilege,
          and(
            eq(s.privilege.id, s.tokenPrivilege.privilegeId),
            eq(s.privilege.handle, input.privilegeHandle),
          ),
        )
        .where(
          and(
            eq(s.token.id, input.apiKeyId),
            activeApiKeyCondition(),
            exists(
              query
                .select({ id: sql`1` })
                .from(s.person)
                .innerJoin(
                  s.personLocationLink,
                  and(
                    eq(s.personLocationLink.personId, s.person.id),
                    eq(s.personLocationLink.locationId, input.locationId),
                    eq(s.personLocationLink.status, "linked"),
                  ),
                )
                .innerJoin(
                  s.actor,
                  and(
                    eq(s.actor.personId, s.person.id),
                    eq(s.actor.locationId, input.locationId),
                    isNull(s.actor.deletedAt),
                    inArray(s.actor.type, input.actorTypes),
                  ),
                )
                .where(
                  and(
                    eq(s.person.userId, s.token.userId),
                    isNull(s.person.deletedAt),
                  ),
                ),
            ),
          ),
        )
        .limit(1);

      return rows.length > 0;
    },
  ),
);
