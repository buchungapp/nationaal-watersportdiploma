CREATE TABLE "ai_corpus"."outline_template" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"profiel_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"sections" jsonb NOT NULL,
	"notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "ai_corpus"."outline_template" ADD CONSTRAINT "outline_template_profiel_id_kwalificatieprofiel_id_fk" FOREIGN KEY ("profiel_id") REFERENCES "kss"."kwalificatieprofiel"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "outline_template_profiel_version_unique" ON "ai_corpus"."outline_template" USING btree ("profiel_id","version");