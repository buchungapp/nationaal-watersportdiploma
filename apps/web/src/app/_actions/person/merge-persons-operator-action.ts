"use server";

import { useQuery as gebruikQuery, User } from "@nawadi/core";
import { schema as s } from "@nawadi/db";
import { and, count, eq, isNotNull, isNull, ne } from "@nawadi/db/drizzle";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getPrimaryPerson,
  getUserOrThrow,
  isActiveActorTypeInLocationServerHelper,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Operator-facing variants of the merge actions. Same shape as the sysadmin
// versions in merge-persons-action.ts but auth-gated to location_admin and
// scoped to the operator's location's linked-active person set.
//
// Every action takes a locationId so the auth check + GDPR scope can be
// enforced server-side. The dialog UI passes the locationId from its props.

async function requireOperator(locationId: string) {
  const authUser = await getUserOrThrow();
  const operator = await getPrimaryPerson(authUser);
  await isActiveActorTypeInLocationServerHelper({
    actorType: ["location_admin"],
    locationId,
    personId: operator.id,
  });
  return operator;
}

async function requireInScope(personId: string, locationId: string) {
  const inScope = await User.Person.isInLocationScope({
    personId,
    locationId,
  });
  if (!inScope) {
    throw new Error(
      "Persoon valt buiten jouw locatie — neem contact op met NWD om verder te helpen.",
    );
  }
}

// Action 0: Get a single person by ID — scoped to operator's location.
export const getOperatorPersonByIdAction = actionClientWithMeta
  .metadata({ name: "person.operator.get-by-id" })
  .inputSchema(
    z.object({
      personId: z.string().uuid(),
      locationId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireOperator(parsedInput.locationId);
    await requireInScope(parsedInput.personId, parsedInput.locationId);
    return User.Person.byIdOrHandle({ id: parsedInput.personId });
  });

// Action 1: Autocomplete search restricted to the operator's location.
export const searchOperatorPersonsAction = actionClientWithMeta
  .metadata({ name: "person.operator.search-for-merge" })
  .inputSchema(
    z.object({
      query: z.string().min(1),
      locationId: z.string().uuid(),
      limit: z.number().min(1).max(20).default(10),
      excludePersonId: z.string().uuid().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireOperator(parsedInput.locationId);
    const persons = await User.Person.searchForAutocompleteInLocation({
      q: parsedInput.query,
      locationId: parsedInput.locationId,
      limit: parsedInput.limit,
      excludePersonId: parsedInput.excludePersonId,
    });
    return { items: persons };
  });

// Helper — same as the sysadmin version's getPersonStats. Inlined here
// rather than imported to keep the auth boundary obvious.
async function getPersonStats(personId: string) {
  const query = gebruikQuery();
  const [actorR, locationR, curriculumR, issuedCertR, logR, roleR, kwalR] =
    await Promise.all([
      query
        .select({ count: count() })
        .from(s.actor)
        .where(and(eq(s.actor.personId, personId), isNull(s.actor.deletedAt)))
        .then((r) => r[0]?.count ?? 0),
      query
        .select({ count: count() })
        .from(s.personLocationLink)
        .where(
          and(
            eq(s.personLocationLink.personId, personId),
            eq(s.personLocationLink.status, "linked"),
          ),
        )
        .then((r) => r[0]?.count ?? 0),
      query
        .select({ count: count() })
        .from(s.studentCurriculum)
        .where(eq(s.studentCurriculum.personId, personId))
        .then((r) => r[0]?.count ?? 0),
      // Real issued certificates (s.certificate.issuedAt IS NOT NULL) joined
      // through student_curriculum. The earlier `certificateCount` field
      // counted curriculum starts, which is misleading for the operator
      // dialog — operators care about diploma's, not in-progress courses.
      query
        .select({ count: count() })
        .from(s.certificate)
        .innerJoin(
          s.studentCurriculum,
          eq(s.studentCurriculum.id, s.certificate.studentCurriculumId),
        )
        .where(
          and(
            eq(s.studentCurriculum.personId, personId),
            isNotNull(s.certificate.issuedAt),
          ),
        )
        .then((r) => r[0]?.count ?? 0),
      query
        .select({ count: count() })
        .from(s.logbook)
        .where(eq(s.logbook.personId, personId))
        .then((r) => r[0]?.count ?? 0),
      query
        .select({ count: count() })
        .from(s.personRole)
        .where(eq(s.personRole.personId, personId))
        .then((r) => r[0]?.count ?? 0),
      query
        .select({ count: count() })
        .from(s.persoonKwalificatie)
        .where(eq(s.persoonKwalificatie.personId, personId))
        .then((r) => r[0]?.count ?? 0),
    ]);
  return {
    actorCount: actorR,
    locationCount: locationR,
    // Curriculum starts ("Cursusinschrijvingen") — kept for sysadmin
    // surfaces. Operator dialog renders issuedCertificateCount instead.
    certificateCount: curriculumR,
    issuedCertificateCount: issuedCertR,
    logbookCount: logR,
    roleCount: roleR,
    kwalificatieCount: kwalR,
  };
}

async function countOtherPersonsForUser(
  userId: string,
  excludePersonId: string,
) {
  const query = gebruikQuery();
  return query
    .select({ count: count() })
    .from(s.person)
    .where(
      and(
        eq(s.person.userId, userId),
        ne(s.person.id, excludePersonId),
        isNull(s.person.deletedAt),
      ),
    )
    .then((r) => r[0]?.count ?? 0);
}

// Action 2: Merge preflight scoped to the operator's location.
export const getOperatorMergePreflightAction = actionClientWithMeta
  .metadata({ name: "person.operator.get-merge-preflight" })
  .inputSchema(
    z.object({
      primaryPersonId: z.string().uuid(),
      duplicatePersonId: z.string().uuid(),
      locationId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireOperator(parsedInput.locationId);
    await Promise.all([
      requireInScope(parsedInput.primaryPersonId, parsedInput.locationId),
      requireInScope(parsedInput.duplicatePersonId, parsedInput.locationId),
    ]);

    const [primary, duplicate, primaryStats, duplicateStats] =
      await Promise.all([
        User.Person.byIdOrHandle({ id: parsedInput.primaryPersonId }),
        User.Person.byIdOrHandle({ id: parsedInput.duplicatePersonId }),
        getPersonStats(parsedInput.primaryPersonId),
        getPersonStats(parsedInput.duplicatePersonId),
      ]);

    const warnings: Array<{ type: string; message: string }> = [];
    if (duplicate.userId) {
      warnings.push({
        type: "user_account",
        message:
          "Het duplicaat heeft een gekoppeld gebruikersaccount. Na samenvoegen blijft alleen het account van het primaire profiel actief.",
      });
    }
    if (duplicate.isPrimary && duplicate.userId) {
      const otherCount = await countOtherPersonsForUser(
        duplicate.userId,
        parsedInput.duplicatePersonId,
      );
      if (otherCount === 0) {
        warnings.push({
          type: "orphan_user",
          message:
            "Let op: na samenvoegen heeft het gebruikersaccount van het duplicaat geen profielen meer. Dit account kan niet meer inloggen — neem contact op met NWD bij twijfel.",
        });
      }
    }
    return {
      primary: { person: primary, stats: primaryStats },
      duplicate: { person: duplicate, stats: duplicateStats },
      warnings,
    };
  });

// Action 3: Execute merge with audit-trail metadata.
export const mergeOperatorPersonsAction = actionClientWithMeta
  .metadata({ name: "person.operator.merge-persons" })
  .inputSchema(
    z.object({
      primaryPersonId: z.string().uuid(),
      duplicatePersonId: z.string().uuid(),
      locationId: z.string().uuid(),
      // Origin surface — drives the audit row's `source` field so the
      // forensics trail distinguishes personen-page merges from cohort
      // banner merges.
      source: z.enum(["personen_page", "cohort_view"]),
    }),
  )
  .action(async ({ parsedInput }) => {
    const operator = await requireOperator(parsedInput.locationId);
    await Promise.all([
      requireInScope(parsedInput.primaryPersonId, parsedInput.locationId),
      requireInScope(parsedInput.duplicatePersonId, parsedInput.locationId),
    ]);

    if (parsedInput.primaryPersonId === parsedInput.duplicatePersonId) {
      throw new Error("Kan een persoon niet met zichzelf samenvoegen");
    }

    await User.Person.mergePersons({
      personId: parsedInput.duplicatePersonId,
      targetPersonId: parsedInput.primaryPersonId,
      auditMetadata: {
        performedByPersonId: operator.id,
        locationId: parsedInput.locationId,
        source: parsedInput.source,
      },
    });

    revalidatePath("/locatie/[location]/personen", "page");
    revalidatePath("/locatie/[location]/cohorten", "page");

    return { success: true };
  });
