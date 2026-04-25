CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE "api_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"oauth_client_id" uuid,
	"vaarschool_id" uuid,
	"request_id" text,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status" integer NOT NULL,
	"duration_ms" integer,
	"request_body" jsonb,
	"response_body" jsonb,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DROP INDEX "person_idx_name_search";
ALTER TABLE "cohort" ADD COLUMN "external_ref" text;
ALTER TABLE "cohort" ADD COLUMN "created_by_oauth_client_id" uuid;
ALTER TABLE "cohort_allocation" ADD COLUMN "external_ref" text;
ALTER TABLE "cohort_allocation" ADD COLUMN "created_by_oauth_client_id" uuid;
ALTER TABLE "person" ADD COLUMN "merged_into_person_id" uuid;
ALTER TABLE "api_audit_log" ADD CONSTRAINT "api_audit_log_oauth_client_id_fk" FOREIGN KEY ("oauth_client_id") REFERENCES "better_auth"."oauth_client"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "api_audit_log_idx_oauth_client_id" ON "api_audit_log" USING btree ("oauth_client_id");
CREATE INDEX "api_audit_log_idx_vaarschool_id" ON "api_audit_log" USING btree ("vaarschool_id");
CREATE INDEX "api_audit_log_idx_created_at" ON "api_audit_log" USING btree ("created_at");
ALTER TABLE "cohort" ADD CONSTRAINT "cohort_created_by_oauth_client_id_fk" FOREIGN KEY ("created_by_oauth_client_id") REFERENCES "better_auth"."oauth_client"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cohort_allocation" ADD CONSTRAINT "cohort_allocation_created_by_oauth_client_id_fk" FOREIGN KEY ("created_by_oauth_client_id") REFERENCES "better_auth"."oauth_client"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "person" ADD CONSTRAINT "person_merged_into_person_id_fk" FOREIGN KEY ("merged_into_person_id") REFERENCES "public"."person"("id") ON DELETE set null ON UPDATE no action;
CREATE UNIQUE INDEX "cohort_unq_external_ref" ON "cohort" USING btree ("location_id","created_by_oauth_client_id","external_ref") WHERE "cohort"."deleted_at" IS NULL AND "cohort"."external_ref" IS NOT NULL;
CREATE UNIQUE INDEX "cohort_allocation_unq_external_ref" ON "cohort_allocation" USING btree ("cohort_id","created_by_oauth_client_id","external_ref") WHERE "cohort_allocation"."deleted_at" IS NULL AND "cohort_allocation"."external_ref" IS NOT NULL;
CREATE INDEX "person_idx_first_last_trgm" ON "person" USING gin ((
        COALESCE("first_name", '') || ' ' ||
        COALESCE("last_name_prefix", '') || ' ' ||
        COALESCE("last_name", '')
      ) gin_trgm_ops);
CREATE INDEX "person_idx_merged_into" ON "person" USING btree ("merged_into_person_id");
CREATE INDEX "person_location_link_idx_location_id" ON "person_location_link" USING btree ("location_id");
CREATE INDEX "person_idx_name_search" ON "person" USING gin (to_tsvector('simple',
        COALESCE("first_name", '') || ' ' ||
        COALESCE("last_name_prefix", '') || ' ' ||
        COALESCE("last_name", '')
      ));