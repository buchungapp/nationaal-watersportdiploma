-- Enable pgvector for the embedding column in ai_corpus.chunk. The extension
-- is resolved via the 'extensions' schema which is on the default search_path,
-- so bare `vector(N)` type references elsewhere in this migration work.
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";
--> statement-breakpoint
CREATE SCHEMA "ai_corpus";

CREATE TYPE "ai_corpus"."consent_level" AS ENUM('seed', 'opt_in_shared', 'user_only');
CREATE TYPE "ai_corpus"."domain" AS ENUM('pvb_portfolio', 'diplomalijn', 'knowledge_center');
CREATE TABLE "ai_corpus"."chunk" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"source_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"word_count" integer NOT NULL,
	"quality_score" numeric(5, 2),
	"criterium_id" uuid,
	"werkproces_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "ai_corpus"."source" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"domain" "ai_corpus"."domain" NOT NULL,
	"source_identifier" text NOT NULL,
	"source_hash" text NOT NULL,
	"content" text NOT NULL,
	"consent_level" "ai_corpus"."consent_level" NOT NULL,
	"contributed_by_user_id" uuid,
	"profiel_id" uuid,
	"niveau_rang" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"char_count" integer NOT NULL,
	"page_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);

ALTER TABLE "ai_corpus"."chunk" ADD CONSTRAINT "chunk_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "ai_corpus"."source"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_corpus"."chunk" ADD CONSTRAINT "chunk_criterium_id_beoordelingscriterium_id_fk" FOREIGN KEY ("criterium_id") REFERENCES "kss"."beoordelingscriterium"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_corpus"."chunk" ADD CONSTRAINT "chunk_werkproces_id_werkproces_id_fk" FOREIGN KEY ("werkproces_id") REFERENCES "kss"."werkproces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_corpus"."source" ADD CONSTRAINT "source_profiel_id_kwalificatieprofiel_id_fk" FOREIGN KEY ("profiel_id") REFERENCES "kss"."kwalificatieprofiel"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "chunk_criterium_quality_idx" ON "ai_corpus"."chunk" USING btree ("criterium_id","quality_score" DESC NULLS LAST);
CREATE INDEX "chunk_source_idx" ON "ai_corpus"."chunk" USING btree ("source_id");
CREATE UNIQUE INDEX "source_domain_hash_unique" ON "ai_corpus"."source" USING btree ("domain","source_hash");