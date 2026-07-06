import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.ts";
import {
  possibleSingleRow,
  uuidSchema,
  withZod,
  wrapCommand,
} from "../../utils/index.ts";

const richtingSchema = z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]);

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
      rows: z.array(importRowSchema),
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
        .innerJoin(s.kerntaak, eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id))
        .innerJoin(
          s.kwalificatieprofiel,
          eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
        )
        .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id));

      let totalToAdd = 0;
      let totalToSkip = 0;

      for (const row of input.rows) {
        const person = await resolvePersonAtLocation(
          query,
          input.locationId,
          row,
        );
        if (!person) {
          results.push({
            rowIndex: row.rowIndex,
            status: "error",
            error:
              "Persoon niet gevonden op deze locatie (zoek op e-mail of NWD-id)",
          });
          continue;
        }

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

        const instructiegroep = await query
          .select({ id: s.instructieGroep.id })
          .from(s.instructieGroep)
          .innerJoin(
            s.instructieGroepCursus,
            eq(s.instructieGroep.id, s.instructieGroepCursus.instructieGroepId),
          )
          .where(
            and(
              eq(s.instructieGroepCursus.courseId, course.id),
              eq(s.instructieGroep.richting, row.richting),
            ),
          )
          .limit(1)
          .then((rows) => rows[0]);

        if (!instructiegroep) {
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

        const existing = await query
          .select({
            kerntaakOnderdeelId: s.persoonKwalificatie.kerntaakOnderdeelId,
          })
          .from(s.persoonKwalificatie)
          .where(
            and(
              eq(s.persoonKwalificatie.personId, person.id),
              eq(s.persoonKwalificatie.courseId, course.id),
            ),
          );

        const existingIds = new Set(
          existing.map((e) => e.kerntaakOnderdeelId),
        );

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

          const values = readyRows.flatMap((row) =>
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

          let added = 0;
          const skipped = readyRows.reduce((sum, row) => sum + row.toSkip, 0);

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

async function resolvePersonAtLocation(
  query: ReturnType<typeof useQuery>,
  locationId: string,
  row: KwalificatieImportRow,
) {
  if (!row.email && !row.nwdId) {
    return null;
  }

  const conditions = [];

  if (row.email) {
    conditions.push(eq(s.user.email, row.email));
  }

  if (row.nwdId) {
    conditions.push(eq(s.person.handle, row.nwdId));
  }

  const persons = await query
    .select({
      id: s.person.id,
      firstName: s.person.firstName,
      lastNamePrefix: s.person.lastNamePrefix,
      lastName: s.person.lastName,
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
    .leftJoin(s.user, eq(s.user.authUserId, s.person.userId))
    .where(
      and(
        isNull(s.person.deletedAt),
        conditions.length > 0 ? or(...conditions) : undefined,
      ),
    )
    .limit(2);

  if (persons.length !== 1) {
    return null;
  }

  return persons[0] ?? null;
}
