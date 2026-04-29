CREATE TYPE "public"."bulk_import_preview_status" AS ENUM('active', 'committed', 'invalidated_max');
CREATE TYPE "public"."person_merge_audit_decision_kind" AS ENUM('create_new', 'use_existing', 'merge', 'skip');
CREATE TYPE "public"."person_merge_audit_source" AS ENUM('bulk_import_preview', 'personen_page', 'cohort_view', 'single_create_dialog', 'sysadmin');
CREATE TABLE "bulk_import_preview" (
	"token" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"location_id" uuid NOT NULL,
	"created_by_person_id" uuid NOT NULL,
	"target_cohort_id" uuid,
	"detection_snapshot" jsonb NOT NULL,
	"rows_parsed" jsonb NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"status" "bulk_import_preview_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"committed_at" timestamp with time zone
);

CREATE TABLE "person_merge_audit" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"performed_by_person_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"source_person_id" uuid,
	"target_person_id" uuid NOT NULL,
	"decision_kind" "person_merge_audit_decision_kind" NOT NULL,
	"presented_candidate_person_ids" uuid[],
	"score" integer,
	"reasons" text[],
	"source" "person_merge_audit_source" NOT NULL,
	"bulk_import_preview_token" uuid,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "bulk_import_preview" ADD CONSTRAINT "bulk_import_preview_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bulk_import_preview" ADD CONSTRAINT "bulk_import_preview_created_by_person_id_fk" FOREIGN KEY ("created_by_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bulk_import_preview" ADD CONSTRAINT "bulk_import_preview_target_cohort_id_fk" FOREIGN KEY ("target_cohort_id") REFERENCES "public"."cohort"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "person_merge_audit" ADD CONSTRAINT "person_merge_audit_performed_by_person_id_fk" FOREIGN KEY ("performed_by_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "person_merge_audit" ADD CONSTRAINT "person_merge_audit_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "person_merge_audit" ADD CONSTRAINT "person_merge_audit_target_person_id_fk" FOREIGN KEY ("target_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "person_merge_audit" ADD CONSTRAINT "person_merge_audit_bulk_import_preview_token_fk" FOREIGN KEY ("bulk_import_preview_token") REFERENCES "public"."bulk_import_preview"("token") ON DELETE no action ON UPDATE no action;
CREATE INDEX "bulk_import_preview_expires_at_idx" ON "bulk_import_preview" USING btree ("expires_at") WHERE status = 'active';
CREATE INDEX "person_merge_audit_target_person_id_idx" ON "person_merge_audit" USING btree ("target_person_id");
CREATE INDEX "person_merge_audit_location_id_idx" ON "person_merge_audit" USING btree ("location_id");
CREATE INDEX "person_merge_audit_performed_at_idx" ON "person_merge_audit" USING btree ("performed_at");