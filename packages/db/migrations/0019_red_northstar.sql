DROP INDEX IF EXISTS "token_usage_token_id_used_at_index";
ALTER TABLE "student_cohort_progress" DROP CONSTRAINT "student_cohort_progress_pkey";
ALTER TABLE "student_cohort_progress" ADD COLUMN "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL;
ALTER TABLE "student_cohort_progress" ADD COLUMN "created_by" uuid NOT NULL;
DO $$ BEGIN
 ALTER TABLE "student_cohort_progress" ADD CONSTRAINT "student_cohort_progress_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "cohort_allocation_id_idx" ON "student_cohort_progress" USING btree ("cohort_allocation_id","created_at" DESC NULLS LAST,"curriculum_module_competency_id");
CREATE INDEX IF NOT EXISTS "token_usage_token_id_used_at_index" ON "token_usage" USING btree ("token_id","used_at" DESC NULLS LAST);
ALTER TABLE "student_cohort_progress" DROP COLUMN IF EXISTS "updated_at";
ALTER TABLE "student_cohort_progress" DROP COLUMN IF EXISTS "deleted_at";