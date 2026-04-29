"use server";

import { User, useRedisClient, withRedisClient } from "@nawadi/core";
import { z } from "zod";
import {
  getPrimaryPerson,
  getUserOrThrow,
  isActiveActorTypeInLocationServerHelper,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Single-create dedup hint endpoint.
//
// Operator types name + date-of-birth in the single-create dialog. As they
// type, this action runs and surfaces probable matches in their location's
// linked-active person set. UI shows an inline "Lijkt op een bestaand
// profiel..." suggestion so the operator can pick "use existing" before
// they accidentally create a duplicate.
//
// GDPR boundary: only persons with active personLocationLink to the
// operator's location surface. Same scope as the bulk-import preview.
//
// Rate limit: 10 calls per operator per minute. Mitigates the threshold-
// probing exfiltration concern flagged in the outside-voice review (P0-B).
// Implemented via Redis INCR + EXPIRE with a per-minute window — simple
// and distribution-correct (the limiter shares state across Vercel
// instances). The window key incorporates the current minute floor so
// expiration is automatic and gradual.

const RATE_LIMIT_PER_MINUTE = 10;
const _WINDOW_SECONDS = 60;
const SAFETY_TTL = 90; // a touch longer than the window

async function checkRateLimit(personId: string): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    // Without Redis, we can't enforce the limit cleanly. Fail open for
    // local dev rather than blocking the whole flow — the production
    // deployment always has REDIS_URL set.
    return;
  }
  await withRedisClient({ url: redisUrl }, async () => {
    const redis = useRedisClient();
    const minuteKey = Math.floor(Date.now() / 60_000);
    const key = `dedup-hint-rl:${personId}:${minuteKey}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, SAFETY_TTL);
    }
    if (count > RATE_LIMIT_PER_MINUTE) {
      throw new Error(
        "Te veel zoekopdrachten in korte tijd — wacht een minuut.",
      );
    }
  });
}

export const getDedupHintAction = actionClientWithMeta
  .metadata({ name: "person.dedup-hint" })
  .inputSchema(
    z.object({
      locationId: z.string().uuid(),
      firstName: z.string().min(1).max(200),
      lastName: z.string().nullable(),
      lastNamePrefix: z.string().nullable(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      birthCity: z.string().default(""),
      email: z.string().nullable(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const authUser = await getUserOrThrow();
    const operator = await getPrimaryPerson(authUser);
    await isActiveActorTypeInLocationServerHelper({
      actorType: ["location_admin"],
      locationId: parsedInput.locationId,
      personId: operator.id,
    });

    await checkRateLimit(operator.id);

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: parsedInput.locationId,
      candidates: [
        {
          rowIndex: 0,
          firstName: parsedInput.firstName,
          lastName: parsedInput.lastName,
          lastNamePrefix: parsedInput.lastNamePrefix,
          dateOfBirth: parsedInput.dateOfBirth,
          birthCity: parsedInput.birthCity,
          email: parsedInput.email,
        },
      ],
    });

    const candidates = result.matchesByRow[0]?.candidates ?? [];
    // Only surface strong+ matches in the inline hint to keep noise low.
    // Weak matches show up only in the bulk-import preview where the
    // operator is already in review-mode.
    return {
      candidates: candidates.filter((c) => c.score >= 150),
    };
  });
