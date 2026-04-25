import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { betterAuthOauthClient } from "./better-auth.js";

export const apiAuditLog = pgTable(
  "api_audit_log",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    oauthClientId: uuid("oauth_client_id"),
    vaarschoolId: uuid("vaarschool_id"),
    requestId: text("request_id"),
    method: text("method").notNull(),
    path: text("path").notNull(),
    status: integer("status").notNull(),
    durationMs: integer("duration_ms"),
    requestBody: jsonb("request_body"),
    responseBody: jsonb("response_body"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("api_audit_log_idx_oauth_client_id").on(table.oauthClientId),
    index("api_audit_log_idx_vaarschool_id").on(table.vaarschoolId),
    index("api_audit_log_idx_created_at").on(table.createdAt),
    foreignKey({
      columns: [table.oauthClientId],
      foreignColumns: [betterAuthOauthClient.id],
      name: "api_audit_log_oauth_client_id_fk",
    }).onDelete("set null"),
  ],
);
