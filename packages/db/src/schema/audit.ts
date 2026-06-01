import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { cohort } from "./cohort.js";
import { location } from "./location.js";
import { person } from "./user.js";

export const personMergeAuditDecisionKind = pgEnum(
  "person_merge_audit_decision_kind",
  ["create_new", "use_existing", "merge", "skip"],
);

export const personMergeAuditSource = pgEnum("person_merge_audit_source", [
  "bulk_import_preview",
  "personen_page",
  "cohort_view",
  "single_create_dialog",
  "sysadmin",
]);

export const bulkImportPreviewStatus = pgEnum("bulk_import_preview_status", [
  "active",
  "committed",
  "invalidated_max",
]);

export const bulkImportPreview = pgTable(
  "bulk_import_preview",
  {
    token: uuid("token")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    locationId: uuid("location_id").notNull(),
    createdByPersonId: uuid("created_by_person_id").notNull(),
    targetCohortId: uuid("target_cohort_id"),
    detectionSnapshot: jsonb("detection_snapshot").notNull(),
    rowsParsed: jsonb("rows_parsed").notNull(),
    attempt: integer("attempt").notNull().default(1),
    status: bulkImportPreviewStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    committedAt: timestamp("committed_at", {
      mode: "string",
      withTimezone: true,
    }),
  },
  (table) => [
    index("bulk_import_preview_expires_at_idx")
      .on(table.expiresAt)
      .where(sql`status = 'active'`),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "bulk_import_preview_location_id_fk",
    }),
    foreignKey({
      columns: [table.createdByPersonId],
      foreignColumns: [person.id],
      name: "bulk_import_preview_created_by_person_id_fk",
    }),
    foreignKey({
      columns: [table.targetCohortId],
      foreignColumns: [cohort.id],
      name: "bulk_import_preview_target_cohort_id_fk",
    }),
  ],
);

export const personMergeAudit = pgTable(
  "person_merge_audit",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    performedByPersonId: uuid("performed_by_person_id").notNull(),
    locationId: uuid("location_id").notNull(),
    sourcePersonId: uuid("source_person_id"),
    targetPersonId: uuid("target_person_id").notNull(),
    decisionKind: personMergeAuditDecisionKind("decision_kind").notNull(),
    presentedCandidatePersonIds: uuid("presented_candidate_person_ids").array(),
    score: integer("score"),
    reasons: text("reasons").array(),
    source: personMergeAuditSource("source").notNull(),
    bulkImportPreviewToken: uuid("bulk_import_preview_token"),
    performedAt: timestamp("performed_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("person_merge_audit_target_person_id_idx").on(table.targetPersonId),
    index("person_merge_audit_location_id_idx").on(table.locationId),
    index("person_merge_audit_performed_at_idx").on(table.performedAt),
    // NOTE: none of the person-referencing columns (source_person_id,
    // target_person_id, performed_by_person_id) carry a foreign key. The
    // merge engine deletes the source person row, and any of these UUIDs may
    // point at a person who is later merged away. This is an immutable
    // forensic log: it records the UUIDs as historical fact and must outlive
    // the live person rows. A RESTRICT FK here would block legitimate merges
    // (e.g. chained A->B->C, where B was a prior target/performer), and a
    // cascading/repointing FK would falsify the recorded history. We keep the
    // UUIDs for traceability; the live rows may be gone.
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "person_merge_audit_location_id_fk",
    }),
    foreignKey({
      columns: [table.bulkImportPreviewToken],
      foreignColumns: [bulkImportPreview.token],
      name: "person_merge_audit_bulk_import_preview_token_fk",
    }),
  ],
);
