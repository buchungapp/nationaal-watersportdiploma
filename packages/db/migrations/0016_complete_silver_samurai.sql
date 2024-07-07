DO $$ BEGIN
 CREATE TYPE "public"."role_type" AS ENUM('organization', 'location', 'cohort');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "cohort_allocation_role" (
	"cohort_allocation_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "cohort_allocation_role_cohort_allocation_id_role_id_pk" PRIMARY KEY("cohort_allocation_id","role_id")
);

CREATE TABLE IF NOT EXISTS "student_cohort_progress" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"cohort_allocation_id" uuid NOT NULL,
	"curriculum_module_competency_id" uuid NOT NULL,
	"progress" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);

DROP TABLE "student_competency_progress";
DROP INDEX IF EXISTS "cohort_handle_index";
DROP INDEX IF EXISTS "token_usage_token_id_used_at_index";
ALTER TABLE "role" ADD COLUMN "type" "role_type" NOT NULL;
ALTER TABLE "certificate" ADD COLUMN "cohort_allocation_id" uuid;
ALTER TABLE "cohort_allocation" ADD COLUMN "instructor_id" uuid;
ALTER TABLE "person" ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;
DO $$ BEGIN
 ALTER TABLE "cohort_allocation_role" ADD CONSTRAINT "cohort_allocation_role_allocation_id_fk" FOREIGN KEY ("cohort_allocation_id") REFERENCES "public"."cohort_allocation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cohort_allocation_role" ADD CONSTRAINT "user_role_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_cohort_progress" ADD CONSTRAINT "student_cohort_progress_cohort_allocation_id_fk" FOREIGN KEY ("cohort_allocation_id") REFERENCES "public"."cohort_allocation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_cohort_progress" ADD CONSTRAINT "curriculum_competency_competency_id_fk" FOREIGN KEY ("curriculum_module_competency_id") REFERENCES "public"."curriculum_competency"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_cohort_progress" ADD CONSTRAINT "student_cohort_progress_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "cohort_allocation_id_idx" ON "student_cohort_progress" USING btree ("cohort_allocation_id","created_at" DESC NULLS LAST,"curriculum_module_competency_id");
DO $$ BEGIN
 ALTER TABLE "certificate" ADD CONSTRAINT "certificate_cohort_allocation_id_fk" FOREIGN KEY ("cohort_allocation_id") REFERENCES "public"."cohort_allocation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cohort_allocation" ADD CONSTRAINT "cohort_allocation_instructor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cohort_handle_location_id_index" ON "cohort" USING btree ("handle","location_id") WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "unq_primary_person" ON "person" USING btree ("user_id","is_primary") WHERE "person"."is_primary" = true;
CREATE INDEX IF NOT EXISTS "token_usage_token_id_used_at_index" ON "token_usage" USING btree ("token_id","used_at" DESC NULLS LAST);