"use server";

import {
  useQuery as gebruikQuery,
  User,
  withSupabaseClient,
} from "@nawadi/core";
import { schema as s } from "@nawadi/db";
import { and, count, eq, isNull, ne } from "@nawadi/db/drizzle";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow, supabaseConfig } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Action 0: Get a single person by ID (lightweight, for pre-populating the dialog)
export const getPersonByIdAction = actionClientWithMeta
  .metadata({ name: "person.get-by-id" })
  .inputSchema(z.object({ personId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getUserOrThrow();
    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang");
    }

    return User.Person.byIdOrHandle({ id: parsedInput.personId });
  });

// Action 1: Fast search for typeahead (no count query)
export const searchPersonsAction = actionClientWithMeta
  .metadata({ name: "person.search-for-merge" })
  .inputSchema(
    z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(20).default(10),
      excludePersonId: z.string().uuid().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await getUserOrThrow();
    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang");
    }

    // Uses the new lightweight autocomplete query
    const persons = await User.Person.searchForAutocomplete({
      q: parsedInput.query,
      limit: parsedInput.limit,
      excludePersonId: parsedInput.excludePersonId,
    });

    return { items: persons };
  });

// Helper: count related records for a person
async function getPersonStats(personId: string) {
  const query = gebruikQuery();

  const [
    actorResult,
    locationResult,
    certificateResult,
    logbookResult,
    roleResult,
    kwalificatieResult,
  ] = await Promise.all([
    query
      .select({ count: count() })
      .from(s.actor)
      .where(and(eq(s.actor.personId, personId), isNull(s.actor.deletedAt)))
      .then((rows) => rows[0]?.count ?? 0),
    query
      .select({ count: count() })
      .from(s.personLocationLink)
      .where(
        and(
          eq(s.personLocationLink.personId, personId),
          eq(s.personLocationLink.status, "linked"),
        ),
      )
      .then((rows) => rows[0]?.count ?? 0),
    query
      .select({ count: count() })
      .from(s.studentCurriculum)
      .where(eq(s.studentCurriculum.personId, personId))
      .then((rows) => rows[0]?.count ?? 0),
    query
      .select({ count: count() })
      .from(s.logbook)
      .where(eq(s.logbook.personId, personId))
      .then((rows) => rows[0]?.count ?? 0),
    query
      .select({ count: count() })
      .from(s.personRole)
      .where(eq(s.personRole.personId, personId))
      .then((rows) => rows[0]?.count ?? 0),
    query
      .select({ count: count() })
      .from(s.persoonKwalificatie)
      .where(eq(s.persoonKwalificatie.personId, personId))
      .then((rows) => rows[0]?.count ?? 0),
  ]);

  return {
    actorCount: actorResult,
    locationCount: locationResult,
    certificateCount: certificateResult,
    logbookCount: logbookResult,
    roleCount: roleResult,
    kwalificatieCount: kwalificatieResult,
  };
}

// Helper: count other persons for a user (to detect orphan risk)
async function countOtherPersonsForUser(
  userId: string,
  excludePersonId: string,
) {
  const query = gebruikQuery();

  const result = await query
    .select({ count: count() })
    .from(s.person)
    .where(
      and(
        eq(s.person.userId, userId),
        ne(s.person.id, excludePersonId),
        isNull(s.person.deletedAt),
      ),
    )
    .then((rows) => rows[0]?.count ?? 0);

  return result;
}

// Action 2: Get merge preflight - stats for BOTH persons + warnings
// Single request avoids waterfall when both persons are selected
export const getMergePreflightAction = actionClientWithMeta
  .metadata({ name: "person.get-merge-preflight" })
  .inputSchema(
    z.object({
      primaryPersonId: z.string().uuid(),
      duplicatePersonId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await getUserOrThrow();
    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang");
    }

    // Fetch both persons' data in parallel
    const [primaryPerson, duplicatePerson, primaryStats, duplicateStats] =
      await Promise.all([
        User.Person.byIdOrHandle({ id: parsedInput.primaryPersonId }),
        User.Person.byIdOrHandle({ id: parsedInput.duplicatePersonId }),
        getPersonStats(parsedInput.primaryPersonId),
        getPersonStats(parsedInput.duplicatePersonId),
      ]);

    // Build warnings array
    const warnings: Array<{ type: string; message: string }> = [];

    // Warning: duplicate has linked user account
    if (duplicatePerson.userId) {
      warnings.push({
        type: "user_account",
        message:
          "Het duplicaat heeft een gekoppeld gebruikersaccount. " +
          "Na samenvoegen blijft alleen het account van de primaire persoon actief.",
      });
    }

    // Warning: duplicate is isPrimary and would orphan user
    if (duplicatePerson.isPrimary && duplicatePerson.userId) {
      const otherPersonsCount = await countOtherPersonsForUser(
        duplicatePerson.userId,
        parsedInput.duplicatePersonId,
      );
      if (otherPersonsCount === 0) {
        warnings.push({
          type: "orphan_user",
          message:
            "Let op: na samenvoegen heeft het gebruikersaccount van " +
            "het duplicaat geen personen meer. Dit account kan niet meer inloggen.",
        });
      }
    }

    return {
      primary: { person: primaryPerson, stats: primaryStats },
      duplicate: { person: duplicatePerson, stats: duplicateStats },
      warnings,
    };
  });

// Action 3: Execute merge
export const mergePersonsAction = actionClientWithMeta
  .metadata({ name: "person.merge-persons" })
  .inputSchema(
    z.object({
      primaryPersonId: z.string().uuid(),
      duplicatePersonId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await getUserOrThrow();
    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang");
    }

    if (parsedInput.primaryPersonId === parsedInput.duplicatePersonId) {
      throw new Error("Kan een persoon niet met zichzelf samenvoegen");
    }

    await User.Person.mergePersons({
      personId: parsedInput.duplicatePersonId,
      targetPersonId: parsedInput.primaryPersonId,
    });

    revalidatePath("/secretariaat/gebruikers");

    return { success: true };
  });

// Action 4: Update person email (system admin only, no location context)
export const updatePersonEmailForAdminAction = actionClientWithMeta
  .metadata({ name: "person.update-email-admin" })
  .inputSchema(
    z.object({
      personId: z.string().uuid(),
      email: z.string().email(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await getUserOrThrow();
    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang");
    }

    await withSupabaseClient(supabaseConfig, () =>
      User.Person.moveToAccountByEmail({
        personId: parsedInput.personId,
        email: parsedInput.email,
      }),
    );

    revalidatePath("/secretariaat/gebruikers");

    return { success: true };
  });
