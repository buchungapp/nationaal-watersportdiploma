import { schema as s } from "@nawadi/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../contexts/index.js";
import {
  possibleSingleRow,
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
} from "../utils/index.js";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function resolveDisplayName(email: string, displayName?: string | null) {
  const trimmedDisplay = displayName?.trim();
  if (trimmedDisplay) return trimmedDisplay;
  const username = email.split("@")[0];
  if (username && username.length > 0) return username;
  return "User";
}

/**
 * Idempotently ensure a user exists in both `better_auth.user` and `public.user`,
 * preserving the same UUID across both tables.
 */
export const getOrCreateUser = wrapCommand(
  "auth.getOrCreateUser",
  withZod(
    z.object({
      email: z.string().trim().toLowerCase().email(),
      displayName: z.string().optional(),
    }),
    z.object({
      id: uuidSchema,
    }),
    async (input) => {
      const email = normalizeEmail(input.email);
      const name = resolveDisplayName(email, input.displayName);

      return withTransaction(async (tx) => {
        const existingBetterAuth = await tx
          .select({ id: s.betterAuthUser.id })
          .from(s.betterAuthUser)
          .where(eq(s.betterAuthUser.email, email))
          .then(possibleSingleRow);

        const userId =
          existingBetterAuth?.id ??
          (await tx
            .insert(s.betterAuthUser)
            .values({
              email,
              name,
              emailVerified: true,
            })
            .returning({ id: s.betterAuthUser.id })
            .then(singleRow)).id;

        const existingPublic = await tx
          .select({ authUserId: s.user.authUserId })
          .from(s.user)
          .where(eq(s.user.authUserId, userId))
          .then(possibleSingleRow);

        if (!existingPublic) {
          await tx.insert(s.user).values({
            authUserId: userId,
            email,
            displayName: input.displayName,
          });
        }

        return { id: userId };
      });
    },
  ),
);

/**
 * Update a user's email on both `better_auth.user` and `public.user` atomically.
 */
export const updateUserEmail = wrapCommand(
  "auth.updateUserEmail",
  withZod(
    z.object({
      userId: uuidSchema,
      email: z.string().trim().toLowerCase().email(),
    }),
    z.void(),
    async (input) => {
      const email = normalizeEmail(input.email);

      await withTransaction(async (tx) => {
        await tx
          .update(s.betterAuthUser)
          .set({ email })
          .where(eq(s.betterAuthUser.id, input.userId));

        await tx
          .update(s.user)
          .set({ email })
          .where(eq(s.user.authUserId, input.userId));
      });
    },
  ),
);

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const query = useQuery();

  return query
    .select({
      id: s.betterAuthUser.id,
      email: s.betterAuthUser.email,
      name: s.betterAuthUser.name,
    })
    .from(s.betterAuthUser)
    .where(eq(s.betterAuthUser.email, normalized))
    .then(possibleSingleRow);
}
