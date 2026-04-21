import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { kwalificatieprofiel, richting } from "../kss/toetsdocument.js";
import { leercoachChat } from "../leercoach/chat.js";
import { aiCorpusConsentLevel, aiCorpusDomain } from "./enums.js";
import { aiCorpusSchema } from "./schema.js";

// One row per ingested source document (an anonymised portfolio, a diploma
// spec, a knowledge article, ...). Large blobs live here; the searchable
// units live in ai_corpus.chunk.
export const source = aiCorpusSchema.table(
  "source",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    domain: aiCorpusDomain("domain").notNull(),
    // Stable human-readable identifier, unique within a domain. Examples:
    //   pvb_portfolio: "seed:alle_niveau_3_bob" or "user:<uuid>:<upload_id>"
    sourceIdentifier: text("source_identifier").notNull(),
    // SHA-256 of the content, for deduplication on re-ingest.
    sourceHash: text("source_hash").notNull(),
    content: text("content").notNull(),
    consentLevel: aiCorpusConsentLevel("consent_level").notNull(),
    // Opaque user reference for future upload flows. No FK in Phase 1 — when
    // the auth-backed upload flow lands, either add a FK to auth.users or
    // keep this opaque if we ever host elsewhere.
    contributedByUserId: uuid("contributed_by_user_id"),
    // Well-known, FK-enforced reference for the pvb_portfolio domain. Other
    // domains add their own analogous nullable columns via future migrations.
    profielId: uuid("profiel_id"),
    // Coarse-grained classifier for pvb_portfolio uploads where the kandidaat
    // can pinpoint the richting (instructeur / leercoach / pvb_beoordelaar)
    // but not the exact profielId (e.g. old or re-labelled qualifications).
    // When profielId is set this MUST equal the profiel's richting — the app
    // layer derives it from the selected profiel; we trust that rather than
    // enforce a check constraint. Nullable for historic rows + domains that
    // don't carry a richting.
    richting: richting("richting"),
    niveauRang: integer("niveau_rang"),
    // Per-chat scoping for the `artefact` domain (opleidingsplannen,
    // screenshots, emails the kandidaat uploads inside a leercoach chat).
    // Null for every other domain. ON DELETE CASCADE: deleting a chat
    // wipes its artefacten — they have no meaning outside that chat.
    chatId: uuid("chat_id"),
    // Domain-specific non-FK attributes.
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    charCount: integer("char_count").notNull(),
    pageCount: integer("page_count"),
    // Path in Supabase Storage to the original, un-anonymised file
    // (null for text-only sources + legacy rows from before durable
    // ingest landed). Stored so the uploader can always retrieve
    // their original — the anonymised `content` above is what we
    // search/ingest, but the user retains ownership of the raw bytes.
    // Shape: "portfolio-uploads/{userId}/{hash}.pdf". ACL: private,
    // signed-URL access only.
    originalStoragePath: text("original_storage_path"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.profielId],
      foreignColumns: [kwalificatieprofiel.id],
    }),
    foreignKey({
      columns: [table.chatId],
      foreignColumns: [leercoachChat.id],
    }).onDelete("cascade"),
    uniqueIndex("source_domain_hash_unique").on(table.domain, table.sourceHash),
    // Hot path: list artefacten for a chat, newest first.
    index("source_chat_created_idx").on(table.chatId, table.createdAt.desc()),
  ],
);
