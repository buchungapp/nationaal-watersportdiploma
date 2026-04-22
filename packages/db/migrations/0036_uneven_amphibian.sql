CREATE TYPE "leercoach"."upload_job_kind" AS ENUM('portfolio');
CREATE TYPE "leercoach"."upload_job_status" AS ENUM('pending', 'processing', 'ready', 'failed');
CREATE TABLE "leercoach"."upload_job" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "leercoach"."upload_job_kind" NOT NULL,
	"status" "leercoach"."upload_job_status" DEFAULT 'pending' NOT NULL,
	"blob_path" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"workflow_run_id" text,
	"source_id" uuid,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);

ALTER TABLE "ai_corpus"."source" ADD COLUMN "original_storage_path" text;
CREATE INDEX "upload_job_user_created_idx" ON "leercoach"."upload_job" USING btree ("user_id","created_at" DESC NULLS LAST);
CREATE INDEX "upload_job_status_idx" ON "leercoach"."upload_job" USING btree ("status");