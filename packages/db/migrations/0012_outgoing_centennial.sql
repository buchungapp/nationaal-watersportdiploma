DO $$ BEGIN
 CREATE TYPE "feedback_type" AS ENUM('bug', 'product-feedback', 'program-feedback', 'question', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "feedback" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"type" "feedback_type" NOT NULL,
	"message" text,
	"path" text,
	"query" jsonb DEFAULT '{}'::jsonb,
	"headers" jsonb DEFAULT '{}'::jsonb,
	"base" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"priority" integer DEFAULT 1 NOT NULL,
	"inserted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"resolved_at" timestamp with time zone
);

ALTER TABLE "cohort" ADD COLUMN "certificates_visible_from" timestamp with time zone;
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_inserted_by_fk" FOREIGN KEY ("inserted_by") REFERENCES "user"("auth_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
