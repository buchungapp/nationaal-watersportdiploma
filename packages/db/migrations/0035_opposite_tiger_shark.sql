CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA "ai_corpus";

CREATE SCHEMA "leercoach";

CREATE TYPE "ai_corpus"."consent_level" AS ENUM('seed', 'opt_in_shared', 'user_only');
CREATE TYPE "ai_corpus"."domain" AS ENUM('pvb_portfolio', 'diplomalijn', 'knowledge_center', 'artefact');
CREATE TYPE "leercoach"."chat_phase" AS ENUM('verkennen', 'ordenen', 'concept', 'verfijnen');
CREATE TYPE "leercoach"."portfolio_version_created_by" AS ENUM('coach', 'user', 'imported');
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

CREATE TABLE "ai_corpus"."outline_template" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"profiel_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"sections" jsonb NOT NULL,
	"notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"richting" "kss"."richting",
	"niveau_rang" integer,
	"chat_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"char_count" integer NOT NULL,
	"page_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);

CREATE TABLE "leercoach"."chat" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"profiel_id" uuid,
	"scope" jsonb,
	"instructie_groep_id" uuid,
	"phase" "leercoach"."chat_phase" DEFAULT 'verkennen' NOT NULL,
	"active_stream_id" text,
	"canceled_at" timestamp with time zone,
	"portfolio_id" uuid,
	"title" text DEFAULT '' NOT NULL,
	"visibility" varchar(16) DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "leercoach"."message" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"parts" jsonb NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"compacted_into_id" uuid,
	"compaction_metadata" jsonb
);

CREATE TABLE "leercoach"."portfolio" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"profiel_id" uuid NOT NULL,
	"scope" jsonb NOT NULL,
	"instructie_groep_id" uuid,
	"title" text DEFAULT '' NOT NULL,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "leercoach"."portfolio_version" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"created_by" "leercoach"."portfolio_version_created_by" NOT NULL,
	"created_by_message_id" uuid,
	"label" text,
	"parent_version_id" uuid,
	"change_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

ALTER TABLE "ai_corpus"."chunk" ADD CONSTRAINT "chunk_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "ai_corpus"."source"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_corpus"."chunk" ADD CONSTRAINT "chunk_criterium_id_beoordelingscriterium_id_fk" FOREIGN KEY ("criterium_id") REFERENCES "kss"."beoordelingscriterium"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_corpus"."chunk" ADD CONSTRAINT "chunk_werkproces_id_werkproces_id_fk" FOREIGN KEY ("werkproces_id") REFERENCES "kss"."werkproces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_corpus"."outline_template" ADD CONSTRAINT "outline_template_profiel_id_kwalificatieprofiel_id_fk" FOREIGN KEY ("profiel_id") REFERENCES "kss"."kwalificatieprofiel"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_corpus"."source" ADD CONSTRAINT "source_profiel_id_kwalificatieprofiel_id_fk" FOREIGN KEY ("profiel_id") REFERENCES "kss"."kwalificatieprofiel"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ai_corpus"."source" ADD CONSTRAINT "source_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "leercoach"."chat"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leercoach"."chat" ADD CONSTRAINT "chat_profiel_id_kwalificatieprofiel_id_fk" FOREIGN KEY ("profiel_id") REFERENCES "kss"."kwalificatieprofiel"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "leercoach"."chat" ADD CONSTRAINT "chat_instructie_groep_id_instructie_groep_id_fk" FOREIGN KEY ("instructie_groep_id") REFERENCES "kss"."instructie_groep"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "leercoach"."message" ADD CONSTRAINT "message_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "leercoach"."chat"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leercoach"."portfolio" ADD CONSTRAINT "portfolio_instructie_groep_id_instructie_groep_id_fk" FOREIGN KEY ("instructie_groep_id") REFERENCES "kss"."instructie_groep"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "leercoach"."portfolio_version" ADD CONSTRAINT "portfolio_version_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "leercoach"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leercoach"."portfolio_version" ADD CONSTRAINT "portfolio_version_parent_version_id_portfolio_version_id_fk" FOREIGN KEY ("parent_version_id") REFERENCES "leercoach"."portfolio_version"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "chunk_criterium_quality_idx" ON "ai_corpus"."chunk" USING btree ("criterium_id","quality_score" DESC NULLS LAST);
CREATE INDEX "chunk_source_idx" ON "ai_corpus"."chunk" USING btree ("source_id");
CREATE UNIQUE INDEX "outline_template_profiel_version_unique" ON "ai_corpus"."outline_template" USING btree ("profiel_id","version");
CREATE UNIQUE INDEX "source_domain_hash_unique" ON "ai_corpus"."source" USING btree ("domain","source_hash");
CREATE INDEX "source_chat_created_idx" ON "ai_corpus"."source" USING btree ("chat_id","created_at" DESC NULLS LAST);
CREATE INDEX "chat_user_created_idx" ON "leercoach"."chat" USING btree ("user_id","created_at" DESC NULLS LAST);
CREATE INDEX "chat_profiel_idx" ON "leercoach"."chat" USING btree ("profiel_id");
CREATE INDEX "message_chat_created_idx" ON "leercoach"."message" USING btree ("chat_id","created_at");
CREATE INDEX "message_active_chat_created_idx" ON "leercoach"."message" USING btree ("chat_id","created_at") WHERE "leercoach"."message"."compacted_into_id" is null;
CREATE INDEX "portfolio_user_created_idx" ON "leercoach"."portfolio" USING btree ("user_id","created_at" DESC NULLS LAST);
CREATE INDEX "portfolio_user_profiel_groep_idx" ON "leercoach"."portfolio" USING btree ("user_id","profiel_id","instructie_groep_id");
CREATE INDEX "portfolio_version_portfolio_created_idx" ON "leercoach"."portfolio_version" USING btree ("portfolio_id","created_at" DESC NULLS LAST);
CREATE UNIQUE INDEX "portfolio_version_portfolio_hash_unique" ON "leercoach"."portfolio_version" USING btree ("portfolio_id","content_hash");