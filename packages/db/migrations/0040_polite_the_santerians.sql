CREATE TYPE "public"."import_session_preview_status" AS ENUM('active', 'expired', 'invalidated', 'committed', 'superseded');
CREATE TYPE "public"."import_session_row_status" AS ENUM('valid', 'invalid');
CREATE TYPE "public"."import_session_status" AS ENUM('open', 'reviewing', 'superseded', 'invalidated', 'cancelled', 'committed');
CREATE TABLE "import_session" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"location_id" uuid NOT NULL,
	"target_cohort_id" uuid NOT NULL,
	"source_system" text NOT NULL,
	"external_session_key" text NOT NULL,
	"generation" integer DEFAULT 1 NOT NULL,
	"status" "import_session_status" DEFAULT 'open' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"payload_hash" text NOT NULL,
	"received_by_token_id" uuid,
	"superseded_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"committed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "import_session_preview" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"import_session_id" uuid NOT NULL,
	"bulk_import_preview_token" uuid NOT NULL,
	"materialized_by_person_id" uuid NOT NULL,
	"status" "import_session_preview_status" DEFAULT 'active' NOT NULL,
	"materialized_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expired_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"committed_at" timestamp with time zone,
	"superseded_at" timestamp with time zone
);

CREATE TABLE "import_session_row" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"import_session_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"row_index" integer NOT NULL,
	"external_row_key" text,
	"first_name" text NOT NULL,
	"last_name_prefix" text,
	"last_name" text NOT NULL,
	"date_of_birth" date,
	"birth_city" text,
	"birth_country" text,
	"email" text,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"raw_payload" jsonb,
	"validation_errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "import_session_row_status" DEFAULT 'valid' NOT NULL,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "import_session_row_commit" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"import_session_row_id" uuid NOT NULL,
	"bulk_import_preview_token" uuid NOT NULL,
	"person_merge_audit_id" uuid,
	"cohort_allocation_id" uuid,
	"target_person_id" uuid,
	"decision_kind" "person_merge_audit_decision_kind" NOT NULL,
	"committed_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "import_session" ADD CONSTRAINT "import_session_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session" ADD CONSTRAINT "import_session_target_cohort_id_fk" FOREIGN KEY ("target_cohort_id") REFERENCES "public"."cohort"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session" ADD CONSTRAINT "import_session_received_by_token_id_fk" FOREIGN KEY ("received_by_token_id") REFERENCES "public"."token"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session_preview" ADD CONSTRAINT "import_session_preview_import_session_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_session"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session_preview" ADD CONSTRAINT "import_session_preview_bulk_import_preview_token_fk" FOREIGN KEY ("bulk_import_preview_token") REFERENCES "public"."bulk_import_preview"("token") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session_preview" ADD CONSTRAINT "import_session_preview_materialized_by_person_id_fk" FOREIGN KEY ("materialized_by_person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session_row" ADD CONSTRAINT "import_session_row_import_session_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_session"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session_row_commit" ADD CONSTRAINT "import_session_row_commit_import_session_row_id_fk" FOREIGN KEY ("import_session_row_id") REFERENCES "public"."import_session_row"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session_row_commit" ADD CONSTRAINT "import_session_row_commit_bulk_import_preview_token_fk" FOREIGN KEY ("bulk_import_preview_token") REFERENCES "public"."bulk_import_preview"("token") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session_row_commit" ADD CONSTRAINT "import_session_row_commit_person_merge_audit_id_fk" FOREIGN KEY ("person_merge_audit_id") REFERENCES "public"."person_merge_audit"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "import_session_row_commit" ADD CONSTRAINT "import_session_row_commit_cohort_allocation_id_fk" FOREIGN KEY ("cohort_allocation_id") REFERENCES "public"."cohort_allocation"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "import_session_external_identity_generation_idx" ON "import_session" USING btree ("location_id","target_cohort_id","source_system","external_session_key","generation");
CREATE INDEX "import_session_external_identity_idx" ON "import_session" USING btree ("location_id","target_cohort_id","source_system","external_session_key");
CREATE INDEX "import_session_scope_status_idx" ON "import_session" USING btree ("location_id","target_cohort_id","source_system","status");
CREATE UNIQUE INDEX "import_session_preview_active_session_idx" ON "import_session_preview" USING btree ("import_session_id") WHERE "import_session_preview"."status" = 'active';
CREATE UNIQUE INDEX "import_session_preview_token_idx" ON "import_session_preview" USING btree ("bulk_import_preview_token");
CREATE INDEX "import_session_preview_session_status_idx" ON "import_session_preview" USING btree ("import_session_id","status");
CREATE UNIQUE INDEX "import_session_row_revision_row_index_idx" ON "import_session_row" USING btree ("import_session_id","revision","row_index");
CREATE UNIQUE INDEX "import_session_row_revision_external_key_idx" ON "import_session_row" USING btree ("import_session_id","revision","external_row_key") WHERE "import_session_row"."external_row_key" IS NOT NULL;
CREATE INDEX "import_session_row_active_idx" ON "import_session_row" USING btree ("import_session_id","row_index") WHERE "import_session_row"."superseded_at" IS NULL;
CREATE UNIQUE INDEX "import_session_row_commit_row_preview_idx" ON "import_session_row_commit" USING btree ("import_session_row_id","bulk_import_preview_token");
CREATE INDEX "import_session_row_commit_preview_idx" ON "import_session_row_commit" USING btree ("bulk_import_preview_token");
