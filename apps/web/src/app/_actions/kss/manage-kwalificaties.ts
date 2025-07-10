"use server";

import { useQuery as gebruikQuery, withTransaction } from "@nawadi/core";
import { schema as s } from "@nawadi/db";
import { and, eq } from "@nawadi/db/drizzle";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserOrThrow } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Schema for adding a kwalificatie
const addKwalificatieSchema = z.object({
  personId: z.string().uuid(),
  courseId: z.string().uuid(),
  kerntaakOnderdeelId: z.string().uuid(),
  verkregenReden: z.enum(["onbekend", "pvb_instructiegroep_basis"]),
  opmerkingen: z.string().optional(),
});

export const addKwalificatieAction = actionClientWithMeta
  .metadata({ name: "kss.add-kwalificatie" })
  .schema(addKwalificatieSchema)
  .action(async ({ parsedInput: input }) => {
    const user = await getUserOrThrow();

    // Check if user is system admin
    const isSystemAdmin = user.email === "maurits@buchung.nl";
    if (!isSystemAdmin) {
      throw new Error("Geen toegang tot deze functie");
    }

    await withTransaction(async (tx) => {
      // Check if this kwalificatie already exists
      const existing = await tx
        .select({ id: s.persoonKwalificatie.id })
        .from(s.persoonKwalificatie)
        .where(
          and(
            eq(s.persoonKwalificatie.personId, input.personId),
            eq(s.persoonKwalificatie.courseId, input.courseId),
            eq(
              s.persoonKwalificatie.kerntaakOnderdeelId,
              input.kerntaakOnderdeelId,
            ),
          ),
        );

      if (existing.length > 0) {
        throw new Error("Deze kwalificatie bestaat al voor deze persoon");
      }

      // Get the actor who is adding this (system admin)
      const actor = user.persons[0]?.actors.find((a) => a.type === "system");

      // Create the kwalificatie
      await tx.insert(s.persoonKwalificatie).values({
        personId: input.personId,
        courseId: input.courseId,
        kerntaakOnderdeelId: input.kerntaakOnderdeelId,
        verkregenReden: input.verkregenReden,
        opmerkingen: input.opmerkingen,
        toegevoegdDoor: actor?.id,
        toegevoegdOp: new Date().toISOString(),
      });
    });

    revalidatePath(`/secretariaat/instructeur/${input.personId}`);

    return { success: true };
  });

// Schema for removing a kwalificatie
const removeKwalificatieSchema = z.object({
  personId: z.string().uuid(),
  courseId: z.string().uuid(),
  kerntaakOnderdeelId: z.string().uuid(),
});

export const removeKwalificatieAction = actionClientWithMeta
  .metadata({ name: "kss.remove-kwalificatie" })
  .schema(removeKwalificatieSchema)
  .action(async ({ parsedInput: input }) => {
    const user = await getUserOrThrow();

    // Check if user is system admin
    const isSystemAdmin = user.email === "maurits@buchung.nl";
    if (!isSystemAdmin) {
      throw new Error("Geen toegang tot deze functie");
    }

    await withTransaction(async (tx) => {
      const deleted = await tx
        .delete(s.persoonKwalificatie)
        .where(
          and(
            eq(s.persoonKwalificatie.personId, input.personId),
            eq(s.persoonKwalificatie.courseId, input.courseId),
            eq(
              s.persoonKwalificatie.kerntaakOnderdeelId,
              input.kerntaakOnderdeelId,
            ),
          ),
        )
        .returning({ id: s.persoonKwalificatie.id });

      if (deleted.length === 0) {
        throw new Error("Kwalificatie niet gevonden");
      }
    });

    revalidatePath(`/secretariaat/instructeur/${input.personId}`);

    return { success: true };
  });

// Schema for adding multiple kwalificaties
const addBulkKwalificatiesSchema = z.object({
  personId: z.string().uuid(),
  courseId: z.string().uuid(),
  kerntaakOnderdeelIds: z.array(z.string().uuid()).min(1),
  verkregenReden: z.enum(["onbekend", "pvb_instructiegroep_basis"]),
  opmerkingen: z.string().optional(),
});

export const addBulkKwalificatiesAction = actionClientWithMeta
  .metadata({ name: "kss.add-bulk-kwalificaties" })
  .schema(addBulkKwalificatiesSchema)
  .action(async ({ parsedInput: input }) => {
    const user = await getUserOrThrow();

    // Check if user is system admin
    const isSystemAdmin = user.email === "maurits@buchung.nl";
    if (!isSystemAdmin) {
      throw new Error("Geen toegang tot deze functie");
    }

    const results = await withTransaction(async (tx) => {
      // Get the actor who is adding this (system admin)
      const actor = user.persons[0]?.actors.find((a) => a.type === "system");

      // Check for existing kwalificaties
      const existing = await tx
        .select({
          kerntaakOnderdeelId: s.persoonKwalificatie.kerntaakOnderdeelId,
        })
        .from(s.persoonKwalificatie)
        .where(
          and(
            eq(s.persoonKwalificatie.personId, input.personId),
            eq(s.persoonKwalificatie.courseId, input.courseId),
          ),
        );

      const existingIds = new Set(existing.map((e) => e.kerntaakOnderdeelId));
      const newIds = input.kerntaakOnderdeelIds.filter(
        (id) => !existingIds.has(id),
      );
      const skippedIds = input.kerntaakOnderdeelIds.filter((id) =>
        existingIds.has(id),
      );

      // Create the new kwalificaties
      if (newIds.length > 0) {
        await tx.insert(s.persoonKwalificatie).values(
          newIds.map((kerntaakOnderdeelId) => ({
            personId: input.personId,
            courseId: input.courseId,
            kerntaakOnderdeelId,
            verkregenReden: input.verkregenReden,
            opmerkingen: input.opmerkingen,
            toegevoegdDoor: actor?.id,
            toegevoegdOp: new Date().toISOString(),
          })),
        );
      }

      return {
        added: newIds.length,
        skipped: skippedIds.length,
        total: input.kerntaakOnderdeelIds.length,
      };
    });

    revalidatePath(`/secretariaat/instructeur/${input.personId}`);

    return { success: true, ...results };
  });

// Helper function to fetch available kerntaakonderdelen for adding
export async function getAvailableKerntaakonderdelen() {
  const user = await getUserOrThrow();

  // Check if user is system admin
  const isSystemAdmin = user.email === "maurits@buchung.nl";
  if (!isSystemAdmin) {
    throw new Error("Geen toegang tot deze functie");
  }

  const query = gebruikQuery();

  const results = await query
    .select({
      id: s.kerntaakOnderdeel.id,
      type: s.kerntaakOnderdeel.type,
      kerntaakTitel: s.kerntaak.titel,
      kwalificatieprofielTitel: s.kwalificatieprofiel.titel,
      richting: s.kwalificatieprofiel.richting,
      niveau: s.niveau.rang,
    })
    .from(s.kerntaakOnderdeel)
    .innerJoin(s.kerntaak, eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id))
    .innerJoin(
      s.kwalificatieprofiel,
      eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
    )
    .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id))
    .orderBy(
      s.kwalificatieprofiel.richting,
      s.niveau.rang,
      s.kwalificatieprofiel.titel,
      s.kerntaak.titel,
    );

  return results;
}

// Helper function to get detailed kwalificaties for a person
export async function getPersonKwalificaties(personId: string) {
  const user = await getUserOrThrow();

  // Check if user is system admin
  const isSystemAdmin = user.email === "maurits@buchung.nl";
  if (!isSystemAdmin) {
    throw new Error("Geen toegang tot deze functie");
  }

  const query = gebruikQuery();

  const results = await query
    .select({
      personId: s.persoonKwalificatie.personId,
      courseId: s.persoonKwalificatie.courseId,
      courseTitle: s.course.title,
      courseHandle: s.course.handle,
      kerntaakOnderdeelId: s.persoonKwalificatie.kerntaakOnderdeelId,
      kerntaakOnderdeelType: s.kerntaakOnderdeel.type,
      kerntaakTitel: s.kerntaak.titel,
      kwalificatieprofielTitel: s.kwalificatieprofiel.titel,
      richting: s.kwalificatieprofiel.richting,
      niveau: s.niveau.rang,
      verkregenReden: s.persoonKwalificatie.verkregenReden,
      opmerkingen: s.persoonKwalificatie.opmerkingen,
      toegevoegdOp: s.persoonKwalificatie.toegevoegdOp,
    })
    .from(s.persoonKwalificatie)
    .innerJoin(s.course, eq(s.persoonKwalificatie.courseId, s.course.id))
    .innerJoin(
      s.kerntaakOnderdeel,
      eq(s.persoonKwalificatie.kerntaakOnderdeelId, s.kerntaakOnderdeel.id),
    )
    .innerJoin(s.kerntaak, eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id))
    .innerJoin(
      s.kwalificatieprofiel,
      eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
    )
    .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id))
    .where(eq(s.persoonKwalificatie.personId, personId))
    .orderBy(
      s.kwalificatieprofiel.richting,
      s.niveau.rang,
      s.course.title,
      s.kwalificatieprofiel.titel,
      s.kerntaak.titel,
    );

  return results;
}

// Helper function to get existing kerntaak onderdeel IDs for a person and course
export async function getExistingKerntaakOnderdeelIds(
  personId: string,
  courseId: string,
) {
  const user = await getUserOrThrow();

  // Check if user is system admin
  const isSystemAdmin = user.email === "maurits@buchung.nl";
  if (!isSystemAdmin) {
    throw new Error("Geen toegang tot deze functie");
  }

  const query = gebruikQuery();

  const results = await query
    .select({
      kerntaakOnderdeelId: s.persoonKwalificatie.kerntaakOnderdeelId,
    })
    .from(s.persoonKwalificatie)
    .where(
      and(
        eq(s.persoonKwalificatie.personId, personId),
        eq(s.persoonKwalificatie.courseId, courseId),
      ),
    );

  return results.map((r) => r.kerntaakOnderdeelId);
}

// Helper function to get all existing kerntaak onderdeel IDs for a person, grouped by course
export async function getAllExistingKerntaakOnderdeelIdsByCourse(
  personId: string,
) {
  const user = await getUserOrThrow();

  // Check if user is system admin
  const isSystemAdmin = user.email === "maurits@buchung.nl";
  if (!isSystemAdmin) {
    throw new Error("Geen toegang tot deze functie");
  }

  const query = gebruikQuery();

  const results = await query
    .select({
      courseId: s.persoonKwalificatie.courseId,
      kerntaakOnderdeelId: s.persoonKwalificatie.kerntaakOnderdeelId,
    })
    .from(s.persoonKwalificatie)
    .where(eq(s.persoonKwalificatie.personId, personId));

  // Group by courseId
  const grouped: Record<string, string[]> = {};
  for (const result of results) {
    const existing = grouped[result.courseId] || [];
    grouped[result.courseId] = [...existing, result.kerntaakOnderdeelId];
  }

  return grouped;
}
