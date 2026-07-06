import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.ts";
import {
  possibleSingleRow,
  uuidSchema,
  withZod,
  wrapCommand,
} from "../../utils/index.ts";

export const kwalificatieRichtingSchema = z.enum([
  "instructeur",
  "leercoach",
  "pvb_beoordelaar",
]);

const richtingSchema = kwalificatieRichtingSchema;

const MAX_IMPORT_ROWS = 500;

const importRowSchema = z.object({
  rowIndex: z.number().int().nonnegative(),
  email: z.string().trim().toLowerCase().email().optional(),
  nwdId: z.string().trim().optional(),
  courseTitle: z.string().trim().min(1),
  richting: richtingSchema,
  niveau: z.number().int().min(1).max(5),
  kerntaakTitel: z.string().trim().optional(),
  opmerkingen: z.string().trim().optional(),
});

export type KwalificatieImportRow = z.infer<typeof importRowSchema>;

type ResolvedKwalificatie = {
  personId: string;
  courseId: string;
  kerntaakOnderdeelId: string;
  opmerkingen?: string;
};

type PreviewRowResult =
  | {
      rowIndex: number;
      status: "ready";
      personName: string;
      courseTitle: string;
      kwalificatieLabel: string;
      kerntaakOnderdeelCount: number;
      toAdd: ResolvedKwalificatie[];
      toSkip: number;
    }
  | {
      rowIndex: number;
      status: "error";
      error: string;
    };

const BULK_KWALIFICATIE_PREVIEW_TTL_MINUTES = 60;

export const previewBulkImport = wrapCommand(
  "kss.bulkImportKwalificaties.preview",
  withZod(
    z.object({
      locationId: uuidSchema,
      performedByPersonId: uuidSchema,
      rows: z.array(importRowSchema).max(MAX_IMPORT_ROWS),
    }),
    z.object({
      previewToken: z.string().uuid(),
      results: z.array(z.custom<PreviewRowResult>()),
      summary: z.object({
        ready: z.number().int(),
        errors: z.number().int(),
        totalKwalificatiesToAdd: z.number().int(),
        totalKwalificatiesToSkip: z.number().int(),
      }),
    }),
    async (input) => {
      const query = useQuery();
      const results: PreviewRowResult[] = [];

      const courses = await query
        .select({
          id: s.course.id,
          title: s.course.title,
          handle: s.course.handle,
        })
        .from(s.course)
        .where(isNull(s.course.deletedAt));

      const courseByTitle = new Map(
        courses.map((c) => [c.title?.toLowerCase() ?? "", c]),
      );
      const courseByHandle = new Map(
        courses.map((c) => [c.handle.toLowerCase(), c]),
      );

      const kerntaakOnderdelen = await query
        .select({
          id: s.kerntaakOnderdeel.id,
          type: s.kerntaakOnderdeel.type,
          kerntaakTitel: s.kerntaak.titel,
          kwalificatieprofielId: s.kwalificatieprofiel.id,
          kwalificatieprofielTitel: s.kwalificatieprofiel.titel,
          richting: s.kwalificatieprofiel.richting,
          niveau: s.niveau.rang,
        })
        .from(s.kerntaakOnderdeel)
        .innerJoin(
          s.kerntaak,
          eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id),
        )
        .innerJoin(
          s.kwalificatieprofiel,
          eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
        )
        .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id));

      let totalToAdd = 0;
      let totalToSkip = 0;

      const instructorLookup = await loadInstructorLookup(
        query,
        input.locationId,
        input.rows,
      );
      const instructiegroepByCourseRichting =
        await loadInstructiegroepByCourseRichting(query);
      const existingKwalificatieIds = await loadExistingKwalificatieIds(
        query,
        instructorLookup.personIds,
        courses.map((c) => c.id),
      );

      for (const row of input.rows) {
        const personResult = instructorLookup.resolve(row);
        if (personResult.kind === "missing_identifier") {
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error: "E-mailadres of NWD-id is verplicht",
          });
          continue;
        }
        if (personResult.kind === "ambiguous") {
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error:
              "Meerdere personen gevonden — gebruik alleen e-mail of alleen NWD-id",
          });
          continue;
        }
        if (personResult.kind === "not_found") {
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error:
              "Persoon niet gevonden als instructeur op deze locatie (zoek op e-mail of NWD-id)",
          });
          continue;
        }

        const person = personResult.person;

        const course =
          courseByTitle.get(row.courseTitle.toLowerCase()) ??
          courseByHandle.get(row.courseTitle.toLowerCase());

        if (!course) {
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error: `Cursus niet gevonden: ${row.courseTitle}`,
          });
          continue;
        }

        if (
          !instructiegroepByCourseRichting.has(`${course.id}:${row.richting}`)
        ) {
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error: `Cursus is niet gekoppeld aan een instructiegroep voor richting ${row.richting}`,
          });
          continue;
        }

        const matchingResult = resolveMatchingKerntaakOnderdelen(
          kerntaakOnderdelen,
          row,
        );

        if ("error" in matchingResult) {
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error: matchingResult.error,
          });
          continue;
        }

        const matchingOnderdelen = matchingResult.matching;

        if (matchingOnderdelen.length === 0) {
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error: `Geen kerntaak-onderdelen gevonden voor ${row.richting} niveau ${row.niveau}`,
          });
          continue;
        }

        const existingIds =
          existingKwalificatieIds.get(`${person.id}:${course.id}`) ??
          new Set<string>();

        const toAdd: ResolvedKwalificatie[] = [];
        let toSkip = 0;

        for (const ko of matchingOnderdelen) {
          if (existingIds.has(ko.id)) {
            toSkip++;
            continue;
          }
          toAdd.push({
            personId: person.id,
            courseId: course.id,
            kerntaakOnderdeelId: ko.id,
            opmerkingen: row.opmerkingen,
          });
        }

        if (toAdd.length === 0) {
          totalToSkip += toSkip;
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error: "Alle kwalificaties bestaan al voor deze persoon en cursus",
          });
          continue;
        }

        totalToAdd += toAdd.length;
        totalToSkip += toSkip;

        const profielLabel = matchingOnderdelen[0]?.kwalificatieprofielTitel;

        results.push({
          rowIndex: row.rowIndex,
          status: "ready",
          personName: [person.firstName, person.lastNamePrefix, person.lastName]
            .filter(Boolean)
            .join(" "),
          courseTitle: course.title ?? course.handle,
          kwalificatieLabel: `${profielLabel ?? row.richting} (niveau ${row.niveau})`,
          kerntaakOnderdeelCount: toAdd.length,
          toAdd,
          toSkip,
        });
      }

      const expiresAt = new Date(
        Date.now() + BULK_KWALIFICATIE_PREVIEW_TTL_MINUTES * 60 * 1000,
      ).toISOString();

      const [preview] = await query
        .insert(s.bulkImportPreview)
        .values({
          locationId: input.locationId,
          createdByPersonId: input.performedByPersonId,
          targetCohortId: null,
          detectionSnapshot: {},
          rowsParsed: {
            kind: "kwalificatie_import",
            rows: results,
          },
          attempt: 1,
          status: "active",
          expiresAt,
        })
        .returning({ token: s.bulkImportPreview.token });

      if (!preview) {
        throw new Error("Kon preview niet opslaan");
      }

      const ready = results.filter((r) => r.status === "ready").length;
      const errors = results.filter((r) => r.status === "error").length;

      return {
        previewToken: preview.token,
        results,
        summary: {
          ready,
          errors,
          totalKwalificatiesToAdd: totalToAdd,
          totalKwalificatiesToSkip: totalToSkip,
        },
      };
    },
  ),
);

export const commitBulkImport = wrapCommand(
  "kss.bulkImportKwalificaties.commit",
  withZod(
    z.object({
      previewToken: uuidSchema,
      performedByPersonId: uuidSchema,
      toegevoegdDoorActorId: uuidSchema.optional(),
      defaultOpmerkingen: z.string().optional(),
    }),
    z.object({
      added: z.number().int(),
      skipped: z.number().int(),
    }),
    async (input) => {
      const query = useQuery();

      const previewRow = await query
        .select()
        .from(s.bulkImportPreview)
        .where(eq(s.bulkImportPreview.token, input.previewToken))
        .then(possibleSingleRow);

      if (!previewRow) {
        throw new Error("Preview niet gevonden of verlopen");
      }
      if (previewRow.status !== "active") {
        throw new Error("Preview is al verwerkt of geblokkeerd");
      }
      if (previewRow.createdByPersonId !== input.performedByPersonId) {
        throw new Error("Preview hoort niet bij deze gebruiker");
      }
      if (dayjs(previewRow.expiresAt).isBefore(dayjs())) {
        throw new Error("Preview verlopen — plak opnieuw");
      }

      const payload = previewRow.rowsParsed as {
        kind: string;
        rows: PreviewRowResult[];
      };

      if (payload.kind !== "kwalificatie_import") {
        throw new Error("Ongeldige preview");
      }

      const readyRows = payload.rows.filter(
        (r): r is Extract<PreviewRowResult, { status: "ready" }> =>
          r.status === "ready",
      );

      return withTransaction(
        async () => {
          const tx = useQuery();

          const locked = await tx
            .update(s.bulkImportPreview)
            .set({
              status: "committed",
              committedAt: sql`NOW()`,
            })
            .where(
              and(
                eq(s.bulkImportPreview.token, input.previewToken),
                eq(s.bulkImportPreview.status, "active"),
              ),
            )
            .returning({ token: s.bulkImportPreview.token });

          if (locked.length === 0) {
            throw new Error("Preview is al verwerkt of geblokkeerd");
          }

          const rawValues = readyRows.flatMap((row) =>
            row.toAdd.map((item) => ({
              personId: item.personId,
              courseId: item.courseId,
              kerntaakOnderdeelId: item.kerntaakOnderdeelId,
              verkregenReden: "onbekend" as const,
              opmerkingen:
                item.opmerkingen ??
                input.defaultOpmerkingen ??
                "Geïmporteerd via secretariaat",
              toegevoegdDoor: input.toegevoegdDoorActorId,
              toegevoegdOp: new Date().toISOString(),
            })),
          );

          const courseIds = [...new Set(rawValues.map((v) => v.courseId))];
          const activeCourseIds =
            courseIds.length === 0
              ? new Set<string>()
              : new Set(
                  (
                    await tx
                      .select({ id: s.course.id })
                      .from(s.course)
                      .where(
                        and(
                          inArray(s.course.id, courseIds),
                          isNull(s.course.deletedAt),
                        ),
                      )
                  ).map((c) => c.id),
                );

          const seen = new Set<string>();
          const values = rawValues.filter((item) => {
            if (!activeCourseIds.has(item.courseId)) {
              return false;
            }
            const key = `${item.personId}:${item.courseId}:${item.kerntaakOnderdeelId}`;
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });

          let added = 0;
          const skipped =
            readyRows.reduce((sum, row) => sum + row.toSkip, 0) +
            (rawValues.length - values.length);

          if (values.length > 0) {
            const inserted = await tx
              .insert(s.persoonKwalificatie)
              .values(values)
              .onConflictDoNothing({
                target: [
                  s.persoonKwalificatie.personId,
                  s.persoonKwalificatie.courseId,
                  s.persoonKwalificatie.kerntaakOnderdeelId,
                ],
              })
              .returning({ id: s.persoonKwalificatie.id });

            added = inserted.length;
          }

          return { added, skipped };
        },
        { isolationLevel: "read committed" },
      );
    },
  ),
);

type KerntaakOnderdeelRow = {
  id: string;
  type: "portfolio" | "praktijk";
  kerntaakTitel: string;
  kwalificatieprofielId: string;
  kwalificatieprofielTitel: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  niveau: number;
};

function resolveMatchingKerntaakOnderdelen(
  kerntaakOnderdelen: KerntaakOnderdeelRow[],
  row: KwalificatieImportRow,
): { matching: KerntaakOnderdeelRow[] } | { error: string } {
  let candidates = kerntaakOnderdelen.filter(
    (ko) => ko.richting === row.richting && ko.niveau === row.niveau,
  );

  if (row.kerntaakTitel) {
    candidates = candidates.filter(
      (ko) =>
        ko.kerntaakTitel.toLowerCase() === row.kerntaakTitel?.toLowerCase(),
    );
    return { matching: candidates };
  }

  const profielIds = new Set(candidates.map((ko) => ko.kwalificatieprofielId));
  if (profielIds.size > 1) {
    return {
      error:
        "Meerdere kwalificatieprofielen gevonden voor deze richting en niveau — vul de Kerntaak-kolom in",
    };
  }

  return { matching: candidates };
}

async function loadInstructiegroepByCourseRichting(
  query: ReturnType<typeof useQuery>,
) {
  const rows = await query
    .select({
      courseId: s.instructieGroepCursus.courseId,
      richting: s.instructieGroep.richting,
    })
    .from(s.instructieGroepCursus)
    .innerJoin(
      s.instructieGroep,
      eq(s.instructieGroepCursus.instructieGroepId, s.instructieGroep.id),
    );

  return new Set(rows.map((row) => `${row.courseId}:${row.richting}`));
}

async function loadExistingKwalificatieIds(
  query: ReturnType<typeof useQuery>,
  personIds: string[],
  courseIds: string[],
) {
  const map = new Map<string, Set<string>>();

  if (personIds.length === 0 || courseIds.length === 0) {
    return map;
  }

  const rows = await query
    .select({
      personId: s.persoonKwalificatie.personId,
      courseId: s.persoonKwalificatie.courseId,
      kerntaakOnderdeelId: s.persoonKwalificatie.kerntaakOnderdeelId,
    })
    .from(s.persoonKwalificatie)
    .where(
      and(
        inArray(s.persoonKwalificatie.personId, personIds),
        inArray(s.persoonKwalificatie.courseId, courseIds),
      ),
    );

  for (const row of rows) {
    const key = `${row.personId}:${row.courseId}`;
    const set = map.get(key) ?? new Set<string>();
    set.add(row.kerntaakOnderdeelId);
    map.set(key, set);
  }

  return map;
}

type InstructorPerson = {
  id: string;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string | null;
  email: string | null;
  handle: string | null;
};

type PersonLookupResult =
  | { kind: "found"; person: InstructorPerson }
  | { kind: "not_found" }
  | { kind: "ambiguous" }
  | { kind: "missing_identifier" };

async function loadInstructorLookup(
  query: ReturnType<typeof useQuery>,
  locationId: string,
  rows: KwalificatieImportRow[],
) {
  const emails = [
    ...new Set(rows.map((row) => row.email).filter(Boolean)),
  ] as string[];
  const nwdIds = [
    ...new Set(rows.map((row) => row.nwdId).filter(Boolean)),
  ] as string[];

  if (emails.length === 0 && nwdIds.length === 0) {
    return {
      personIds: [] as string[],
      resolve: (): PersonLookupResult => ({ kind: "missing_identifier" }),
    };
  }

  const matchConditions = [];
  if (emails.length > 0) {
    matchConditions.push(inArray(s.user.email, emails));
  }
  if (nwdIds.length > 0) {
    matchConditions.push(inArray(s.person.handle, nwdIds));
  }

  const instructors = await query
    .select({
      id: s.person.id,
      firstName: s.person.firstName,
      lastNamePrefix: s.person.lastNamePrefix,
      lastName: s.person.lastName,
      email: s.user.email,
      handle: s.person.handle,
    })
    .from(s.person)
    .innerJoin(
      s.personLocationLink,
      and(
        eq(s.personLocationLink.personId, s.person.id),
        eq(s.personLocationLink.locationId, locationId),
        eq(s.personLocationLink.status, "linked"),
      ),
    )
    .innerJoin(
      s.actor,
      and(
        eq(s.actor.personId, s.person.id),
        eq(s.actor.locationId, locationId),
        eq(s.actor.type, "instructor"),
        isNull(s.actor.deletedAt),
      ),
    )
    .leftJoin(s.user, eq(s.user.authUserId, s.person.userId))
    .where(
      and(
        isNull(s.person.deletedAt),
        matchConditions.length > 0 ? or(...matchConditions) : undefined,
      ),
    );

  const byEmail = new Map<string, InstructorPerson[]>();
  const byHandle = new Map<string, InstructorPerson[]>();

  for (const person of instructors) {
    if (person.email) {
      const list = byEmail.get(person.email) ?? [];
      list.push(person);
      byEmail.set(person.email, list);
    }
    if (person.handle) {
      const handleList = byHandle.get(person.handle) ?? [];
      handleList.push(person);
      byHandle.set(person.handle, handleList);
    }
  }

  const resolve = (row: KwalificatieImportRow): PersonLookupResult => {
    if (!row.email && !row.nwdId) {
      return { kind: "missing_identifier" };
    }

    const matches = new Map<string, InstructorPerson>();
    if (row.email) {
      for (const person of byEmail.get(row.email) ?? []) {
        matches.set(person.id, person);
      }
    }
    if (row.nwdId) {
      for (const person of byHandle.get(row.nwdId) ?? []) {
        matches.set(person.id, person);
      }
    }

    if (matches.size === 0) {
      return { kind: "not_found" };
    }
    if (matches.size > 1) {
      return { kind: "ambiguous" };
    }

    const person = [...matches.values()][0];
    if (!person) {
      return { kind: "not_found" };
    }

    return { kind: "found", person };
  };

  return {
    personIds: instructors.map((person) => person.id),
    resolve,
  };
}
