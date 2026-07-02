import { sql } from "drizzle-orm";
import {
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import {
  bulkImportPreview,
  personMergeAudit,
  personMergeAuditDecisionKind,
} from "./audit.js";
import { token } from "./authn.js";
import { cohort, cohortAllocation } from "./cohort.js";
import { location } from "./location.js";
import { person } from "./user.js";

export const importSessionStatus = pgEnum("import_session_status", [
  "open",
  "reviewing",
  "superseded",
  "invalidated",
  "cancelled",
  "committed",
]);

export const importSessionRowStatus = pgEnum("import_session_row_status", [
  "valid",
  "invalid",
]);

export const importSessionPreviewStatus = pgEnum(
  "import_session_preview_status",
  ["active", "expired", "invalidated", "committed", "superseded"],
);

export const importSession = pgTable(
  "import_session",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    locationId: uuid("location_id").notNull(),
    targetCohortId: uuid("target_cohort_id").notNull(),
    sourceSystem: text("source_system").notNull(),
    externalSessionKey: text("external_session_key").notNull(),
    generation: integer("generation").notNull().default(1),
    status: importSessionStatus("status").notNull().default("open"),
    revision: integer("revision").notNull().default(1),
    rowCount: integer("row_count").notNull().default(0),
    payloadHash: text("payload_hash").notNull(),
    receivedByTokenId: uuid("received_by_token_id"),
    supersededAt: timestamp("superseded_at", {
      mode: "string",
      withTimezone: true,
    }),
    invalidatedAt: timestamp("invalidated_at", {
      mode: "string",
      withTimezone: true,
    }),
    committedAt: timestamp("committed_at", {
      mode: "string",
      withTimezone: true,
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("import_session_external_identity_generation_idx").on(
      table.locationId,
      table.targetCohortId,
      table.sourceSystem,
      table.externalSessionKey,
      table.generation,
    ),
    index("import_session_external_identity_idx").on(
      table.locationId,
      table.targetCohortId,
      table.sourceSystem,
      table.externalSessionKey,
    ),
    index("import_session_scope_status_idx").on(
      table.locationId,
      table.targetCohortId,
      table.sourceSystem,
      table.status,
    ),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "import_session_location_id_fk",
    }),
    foreignKey({
      columns: [table.targetCohortId],
      foreignColumns: [cohort.id],
      name: "import_session_target_cohort_id_fk",
    }),
    foreignKey({
      columns: [table.receivedByTokenId],
      foreignColumns: [token.id],
      name: "import_session_received_by_token_id_fk",
    }),
  ],
);

export const importSessionRow = pgTable(
  "import_session_row",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    importSessionId: uuid("import_session_id").notNull(),
    revision: integer("revision").notNull(),
    rowIndex: integer("row_index").notNull(),
    externalRowKey: text("external_row_key"),
    firstName: text("first_name").notNull(),
    lastNamePrefix: text("last_name_prefix"),
    lastName: text("last_name").notNull(),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    birthCity: text("birth_city"),
    birthCountry: text("birth_country"),
    email: text("email"),
    tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
    rawPayload: jsonb("raw_payload"),
    validationErrors: jsonb("validation_errors")
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: importSessionRowStatus("status").notNull().default("valid"),
    supersededAt: timestamp("superseded_at", {
      mode: "string",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("import_session_row_revision_row_index_idx").on(
      table.importSessionId,
      table.revision,
      table.rowIndex,
    ),
    uniqueIndex("import_session_row_revision_external_key_idx")
      .on(table.importSessionId, table.revision, table.externalRowKey)
      .where(sql`${table.externalRowKey} IS NOT NULL`),
    index("import_session_row_active_idx")
      .on(table.importSessionId, table.rowIndex)
      .where(sql`${table.supersededAt} IS NULL`),
    foreignKey({
      columns: [table.importSessionId],
      foreignColumns: [importSession.id],
      name: "import_session_row_import_session_id_fk",
    }),
  ],
);

export const importSessionPreview = pgTable(
  "import_session_preview",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    importSessionId: uuid("import_session_id").notNull(),
    bulkImportPreviewToken: uuid("bulk_import_preview_token").notNull(),
    materializedByPersonId: uuid("materialized_by_person_id").notNull(),
    status: importSessionPreviewStatus("status").notNull().default("active"),
    materializedAt: timestamp("materialized_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    expiredAt: timestamp("expired_at", {
      mode: "string",
      withTimezone: true,
    }),
    invalidatedAt: timestamp("invalidated_at", {
      mode: "string",
      withTimezone: true,
    }),
    committedAt: timestamp("committed_at", {
      mode: "string",
      withTimezone: true,
    }),
    supersededAt: timestamp("superseded_at", {
      mode: "string",
      withTimezone: true,
    }),
  },
  (table) => [
    uniqueIndex("import_session_preview_active_session_idx")
      .on(table.importSessionId)
      .where(sql`${table.status} = 'active'`),
    uniqueIndex("import_session_preview_token_idx").on(
      table.bulkImportPreviewToken,
    ),
    index("import_session_preview_session_status_idx").on(
      table.importSessionId,
      table.status,
    ),
    foreignKey({
      columns: [table.importSessionId],
      foreignColumns: [importSession.id],
      name: "import_session_preview_import_session_id_fk",
    }),
    foreignKey({
      columns: [table.bulkImportPreviewToken],
      foreignColumns: [bulkImportPreview.token],
      name: "import_session_preview_bulk_import_preview_token_fk",
    }),
    foreignKey({
      columns: [table.materializedByPersonId],
      foreignColumns: [person.id],
      name: "import_session_preview_materialized_by_person_id_fk",
    }),
  ],
);

export const importSessionRowCommit = pgTable(
  "import_session_row_commit",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    importSessionRowId: uuid("import_session_row_id").notNull(),
    bulkImportPreviewToken: uuid("bulk_import_preview_token").notNull(),
    personMergeAuditId: uuid("person_merge_audit_id"),
    cohortAllocationId: uuid("cohort_allocation_id"),
    targetPersonId: uuid("target_person_id"),
    decisionKind: personMergeAuditDecisionKind("decision_kind").notNull(),
    committedAt: timestamp("committed_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("import_session_row_commit_row_preview_idx").on(
      table.importSessionRowId,
      table.bulkImportPreviewToken,
    ),
    index("import_session_row_commit_preview_idx").on(
      table.bulkImportPreviewToken,
    ),
    foreignKey({
      columns: [table.importSessionRowId],
      foreignColumns: [importSessionRow.id],
      name: "import_session_row_commit_import_session_row_id_fk",
    }),
    foreignKey({
      columns: [table.bulkImportPreviewToken],
      foreignColumns: [bulkImportPreview.token],
      name: "import_session_row_commit_bulk_import_preview_token_fk",
    }),
    foreignKey({
      columns: [table.personMergeAuditId],
      foreignColumns: [personMergeAudit.id],
      name: "import_session_row_commit_person_merge_audit_id_fk",
    }),
    foreignKey({
      columns: [table.cohortAllocationId],
      foreignColumns: [cohortAllocation.id],
      name: "import_session_row_commit_cohort_allocation_id_fk",
    }),
  ],
);
