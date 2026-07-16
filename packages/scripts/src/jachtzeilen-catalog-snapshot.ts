import { createHash } from "node:crypto";

export const JACHTZEILEN_COURSE_HANDLES = [
  "jacht-kajuitzeilen-binnenwater-volwassenen",
  "jacht-kajuitzeilen-ruim-binnenwater-volwassenen",
  "jacht-kajuitzeilen-waddenzee-en-zeeuwse-stromen-volwassenen",
  "jacht-kajuitzeilen-zee-volwassenen",
] as const;

export const CATALOG_TABLE_NAMES = [
  "discipline",
  "category",
  "degree",
  "course",
  "course_category",
  "program",
  "module",
  "competency",
  "gear_type",
  "curriculum",
  "curriculum_module",
  "curriculum_competency",
  "curriculum_gear_link",
] as const;

type CatalogTableName = (typeof CATALOG_TABLE_NAMES)[number];
type CatalogRow = Record<string, unknown>;

export type JachtzeilenCatalogData = Record<CatalogTableName, CatalogRow[]>;

export interface JachtzeilenCatalogSnapshot {
  kind: "jachtzeilen-catalog-snapshot";
  version: 1;
  generatedAt: string;
  sourceService: string;
  catalogHash: string;
  data: JachtzeilenCatalogData;
}

const SHARED_TITLE_CORRECTIONS = new Map<
  string,
  { oldTitle: string; newTitle: string }
>([
  [
    "aanlegen-en-afvaren-met-spiegel-naar-de-wal-met-mooring-lazylines",
    {
      oldTitle:
        "Aanlegen en afvaren met spiegel naar de wal met mooring-/lazylines",
      newTitle:
        "Aanleggen en afvaren met spiegel naar de wal met mooring-/lazy lines",
    },
  ],
  [
    "windorientatie",
    {
      oldTitle: "Windorientatie",
      newTitle: "Windoriëntatie",
    },
  ],
]);

const HASH_FIELDS = {
  discipline: ["id", "handle", "title", "weight", "abbreviation"],
  category: [
    "id",
    "parent_category_id",
    "handle",
    "title",
    "description",
    "weight",
  ],
  degree: ["id", "handle", "title", "rang"],
  course: [
    "id",
    "handle",
    "title",
    "description",
    "discipline_id",
    "abbreviation",
  ],
  course_category: ["id", "course_id", "category_id"],
  program: ["id", "handle", "title", "course_id", "degree_id"],
  module: ["id", "handle", "title", "weight"],
  competency: ["id", "handle", "title", "type", "weight"],
  gear_type: ["id", "handle", "title"],
  curriculum: ["id", "program_id", "revision", "started_at"],
  curriculum_module: ["curriculum_id", "module_id"],
  curriculum_competency: [
    "id",
    "curriculum_id",
    "module_id",
    "competency_id",
    "is_required",
    "requirement",
  ],
  curriculum_gear_link: ["curriculum_id", "gear_type_id"],
} satisfies Record<CatalogTableName, string[]>;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sqlStringList(values: readonly string[]): string {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", ");
}

const courseHandleSql = sqlStringList(JACHTZEILEN_COURSE_HANDLES);

/**
 * This query deliberately exports catalog data only: no people, students,
 * cohorts, locations, certificates, or other operational records.
 *
 * It selects the four Jachtzeilen courses, their 2401/2501 curricula and
 * dependencies, plus the global competency ordering band touched by RR&P and
 * the two approved shared-title corrections.
 */
export const JACHTZEILEN_CATALOG_EXPORT_SQL = `
WITH RECURSIVE
target_courses AS (
  SELECT c.*
  FROM course c
  WHERE c.handle IN (${courseHandleSql})
),
target_course_categories AS (
  SELECT cc.*
  FROM course_category cc
  JOIN target_courses c ON c.id = cc.course_id
),
category_paths AS (
  SELECT cc.category_id AS id, 0 AS depth
  FROM target_course_categories cc
  UNION ALL
  SELECT c.parent_category_id AS id, cp.depth + 1 AS depth
  FROM category_paths cp
  JOIN category c ON c.id = cp.id
  WHERE c.parent_category_id IS NOT NULL
),
target_category_ids AS (
  SELECT id, max(depth) AS depth
  FROM category_paths
  GROUP BY id
),
baseline_curricula AS (
  SELECT cu.*
  FROM curriculum cu
  JOIN program p ON p.id = cu.program_id
  JOIN target_courses c ON c.id = p.course_id
  WHERE cu.revision IN ('2401', '2501')
),
baseline_programs AS (
  SELECT DISTINCT p.*
  FROM program p
  JOIN baseline_curricula cu ON cu.program_id = p.id
),
target_curriculum_modules AS (
  SELECT cm.*
  FROM curriculum_module cm
  JOIN baseline_curricula cu ON cu.id = cm.curriculum_id
),
target_curriculum_competencies AS (
  SELECT cc.*
  FROM curriculum_competency cc
  JOIN baseline_curricula cu ON cu.id = cc.curriculum_id
),
target_curriculum_gear_links AS (
  SELECT cg.*
  FROM curriculum_gear_link cg
  JOIN baseline_curricula cu ON cu.id = cg.curriculum_id
),
target_modules AS (
  SELECT DISTINCT m.*
  FROM module m
  JOIN target_curriculum_modules cm ON cm.module_id = m.id
),
linked_competencies AS (
  SELECT DISTINCT c.*
  FROM competency c
  JOIN target_curriculum_competencies cc ON cc.competency_id = c.id
),
target_competencies AS (
  SELECT * FROM linked_competencies
  UNION
  SELECT c.*
  FROM competency c
  WHERE c.weight >= 906
     OR c.handle IN (
       'reisvoorbereiding-routering-en-planning',
       'aanlegen-en-afvaren-met-spiegel-naar-de-wal-met-mooring-lazylines',
       'windorientatie'
     )
),
target_gear_types AS (
  SELECT DISTINCT g.*
  FROM gear_type g
  JOIN target_curriculum_gear_links cg ON cg.gear_type_id = g.id
)
SELECT jsonb_build_object(
  'discipline', COALESCE((
    SELECT jsonb_agg(to_jsonb(d) ORDER BY d.id)
    FROM discipline d
    WHERE d.id IN (SELECT discipline_id FROM target_courses)
  ), '[]'::jsonb),
  'category', COALESCE((
    SELECT jsonb_agg(to_jsonb(c) ORDER BY ids.depth DESC, c.id)
    FROM category c
    JOIN target_category_ids ids ON ids.id = c.id
  ), '[]'::jsonb),
  'degree', COALESCE((
    SELECT jsonb_agg(to_jsonb(d) ORDER BY d.id)
    FROM degree d
    WHERE d.handle IN (
      'niveau-1', 'niveau-2', 'niveau-3',
      'niveau-4', 'niveau-a', 'niveau-b'
    )
  ), '[]'::jsonb),
  'course', COALESCE((
    SELECT jsonb_agg(to_jsonb(c) ORDER BY c.id)
    FROM target_courses c
  ), '[]'::jsonb),
  'course_category', COALESCE((
    SELECT jsonb_agg(to_jsonb(cc) ORDER BY cc.id)
    FROM target_course_categories cc
  ), '[]'::jsonb),
  'program', COALESCE((
    SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id)
    FROM baseline_programs p
  ), '[]'::jsonb),
  'module', COALESCE((
    SELECT jsonb_agg(to_jsonb(m) ORDER BY m.id)
    FROM target_modules m
  ), '[]'::jsonb),
  'competency', COALESCE((
    SELECT jsonb_agg(to_jsonb(c) ORDER BY c.id)
    FROM target_competencies c
  ), '[]'::jsonb),
  'gear_type', COALESCE((
    SELECT jsonb_agg(to_jsonb(g) ORDER BY g.id)
    FROM target_gear_types g
  ), '[]'::jsonb),
  'curriculum', COALESCE((
    SELECT jsonb_agg(to_jsonb(cu) ORDER BY cu.id)
    FROM baseline_curricula cu
  ), '[]'::jsonb),
  'curriculum_module', COALESCE((
    SELECT jsonb_agg(to_jsonb(cm) ORDER BY cm.curriculum_id, cm.module_id)
    FROM target_curriculum_modules cm
  ), '[]'::jsonb),
  'curriculum_competency', COALESCE((
    SELECT jsonb_agg(to_jsonb(cc) ORDER BY cc.id)
    FROM target_curriculum_competencies cc
  ), '[]'::jsonb),
  'curriculum_gear_link', COALESCE((
    SELECT jsonb_agg(
      to_jsonb(cg) ORDER BY cg.curriculum_id, cg.gear_type_id
    )
    FROM target_curriculum_gear_links cg
  ), '[]'::jsonb)
) AS catalog
`;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function selectFields(row: CatalogRow, fields: readonly string[]): CatalogRow {
  return Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
}

function normalizeCompetenciesForHash(rows: CatalogRow[]): CatalogRow[] {
  const rrp = rows.find(
    (row) => row.handle === "reisvoorbereiding-routering-en-planning",
  );
  const rrpExists = rrp !== undefined;
  if (rrp) {
    invariant(
      rrp.title === "Reisvoorbereiding, Routering en Planning (RR&P)" &&
        rrp.type === "knowledge" &&
        rrp.weight === 907,
      "Existing RR&P competency does not match the approved definition",
    );
  }

  return rows
    .filter((row) => row.handle !== "reisvoorbereiding-routering-en-planning")
    .map((row) => {
      const normalized = selectFields(row, HASH_FIELDS.competency);
      const handle = String(normalized.handle);
      const titleCorrection = SHARED_TITLE_CORRECTIONS.get(handle);
      if (titleCorrection) {
        invariant(
          normalized.title === titleCorrection.oldTitle ||
            normalized.title === titleCorrection.newTitle,
          `Unexpected title for shared competency ${handle}`,
        );
        normalized.title = titleCorrection.newTitle;
      }

      if (
        rrpExists &&
        typeof normalized.weight === "number" &&
        normalized.weight > 907
      ) {
        normalized.weight -= 1;
      }
      return normalized;
    });
}

export function assertCatalogData(
  value: unknown,
): asserts value is JachtzeilenCatalogData {
  invariant(
    value !== null && typeof value === "object" && !Array.isArray(value),
    "Catalog export is not an object",
  );
  const record = value as Record<string, unknown>;
  for (const tableName of CATALOG_TABLE_NAMES) {
    invariant(
      Array.isArray(record[tableName]),
      `Catalog export is missing ${tableName}`,
    );
  }
}

export function computeJachtzeilenCatalogHash(
  data: JachtzeilenCatalogData,
): string {
  assertCatalogData(data);

  const semantic = Object.fromEntries(
    CATALOG_TABLE_NAMES.map((tableName) => {
      const rows =
        tableName === "competency"
          ? normalizeCompetenciesForHash(data[tableName])
          : data[tableName].map((row) =>
              selectFields(row, HASH_FIELDS[tableName]),
            );
      return [
        tableName,
        rows
          .map((row) => stableValue(row) as CatalogRow)
          .sort((left, right) =>
            stableJson(left).localeCompare(stableJson(right)),
          ),
      ];
    }),
  );

  return createHash("sha256").update(stableJson(semantic)).digest("hex");
}

export async function readJachtzeilenCatalogDataFromDatabase(): Promise<JachtzeilenCatalogData> {
  const [{ useQuery }, { sql }] = await Promise.all([
    import("@nawadi/core"),
    import("drizzle-orm"),
  ]);
  const result = await useQuery().execute(
    sql.raw(JACHTZEILEN_CATALOG_EXPORT_SQL),
  );
  const row = result.rows[0] as { catalog?: unknown } | undefined;
  assertCatalogData(row?.catalog);
  return row.catalog;
}

export async function readJachtzeilenCatalogFingerprint(): Promise<{
  data: JachtzeilenCatalogData;
  hash: string;
}> {
  const data = await readJachtzeilenCatalogDataFromDatabase();
  return {
    data,
    hash: computeJachtzeilenCatalogHash(data),
  };
}
