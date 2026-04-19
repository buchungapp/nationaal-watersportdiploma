import { schema as s } from "@nawadi/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

// Mirrors the TS type in the db schema. Kept here so the model surface is
// self-contained (consumers don't need to import from @nawadi/db).
const outlineSectionKinds = [
  "voorwoord",
  "zeil_cv",
  "inleiding",
  "context",
  "pvb_werkproces",
  "reflectie",
  "bijlagen",
  "other",
] as const;

const outlineSectionFilledBys = ["user", "ai", "rubric_driven"] as const;

const outlineSectionSchema = z.object({
  ordinal: z.number().int().nonnegative(),
  kind: z.enum(outlineSectionKinds),
  title: z.string().min(1),
  description: z.string().min(1),
  targetWordCountMin: z.number().int().nullable(),
  targetWordCountMax: z.number().int().nullable(),
  filledBy: z.enum(outlineSectionFilledBys),
  werkprocesId: uuidSchema.nullable(),
  kerntaakId: uuidSchema.nullable(),
});

export const upsertOutlineTemplateInput = z.object({
  profielId: uuidSchema,
  sections: z.array(outlineSectionSchema).min(1),
  notes: z.record(z.unknown()).default({}),
});

export const upsertOutlineTemplateOutput = z.object({
  templateId: uuidSchema,
  profielId: uuidSchema,
  version: z.number().int(),
});

export const getOutlineTemplateInput = z.object({
  profielId: uuidSchema,
});

export const getOutlineTemplateOutput = z
  .object({
    templateId: uuidSchema,
    profielId: uuidSchema,
    version: z.number().int(),
    sections: z.array(outlineSectionSchema),
    generatedAt: z.string(),
  })
  .nullable();

/**
 * Upsert a new template version for a profiel. Always bumps the version
 * number — older versions stay in the table for audit / rollback.
 */
export const upsertOutlineTemplate = wrapCommand(
  "aiCorpus.outlineTemplate.upsert",
  withZod(
    upsertOutlineTemplateInput,
    upsertOutlineTemplateOutput,
    async (input) => {
      return withTransaction(async (tx) => {
        const latest = await tx
          .select({ version: s.outlineTemplate.version })
          .from(s.outlineTemplate)
          .where(eq(s.outlineTemplate.profielId, input.profielId))
          .orderBy(desc(s.outlineTemplate.version))
          .limit(1)
          .then((r) => r[0]);

        const nextVersion = (latest?.version ?? 0) + 1;

        const inserted = await tx
          .insert(s.outlineTemplate)
          .values({
            profielId: input.profielId,
            version: nextVersion,
            sections: input.sections,
            notes: input.notes,
          })
          .returning({ id: s.outlineTemplate.id })
          .then((r) => r[0]);

        if (!inserted) {
          throw new Error("Insert outline_template returned no rows");
        }

        return {
          templateId: inserted.id,
          profielId: input.profielId,
          version: nextVersion,
        };
      });
    },
  ),
);

/** Get the highest-version template for a profiel, or null if none exists. */
export const getOutlineTemplate = wrapQuery(
  "aiCorpus.outlineTemplate.get",
  withZod(
    getOutlineTemplateInput,
    getOutlineTemplateOutput,
    async (input) => {
      const query = useQuery();
      const row = await query
        .select({
          id: s.outlineTemplate.id,
          profielId: s.outlineTemplate.profielId,
          version: s.outlineTemplate.version,
          sections: s.outlineTemplate.sections,
          generatedAt: s.outlineTemplate.generatedAt,
        })
        .from(s.outlineTemplate)
        .where(eq(s.outlineTemplate.profielId, input.profielId))
        .orderBy(desc(s.outlineTemplate.version))
        .limit(1)
        .then((r) => r[0]);

      if (!row) return null;
      return {
        templateId: row.id,
        profielId: row.profielId,
        version: row.version,
        sections: row.sections,
        generatedAt: row.generatedAt,
      };
    },
  ),
);
