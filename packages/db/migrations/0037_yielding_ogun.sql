DROP INDEX "student_curriculum_unq_identity_gear_curriculum";
ALTER TABLE "student_completed_competency" ADD COLUMN "is_merge_conflict_duplicate" boolean DEFAULT false NOT NULL;
CREATE UNIQUE INDEX "student_completed_competency_unq_active_non_merge" ON "student_completed_competency" USING btree ("student_curriculum_id","curriculum_module_competency_id") WHERE "student_completed_competency"."is_merge_conflict_duplicate" = false AND "student_completed_competency"."deleted_at" IS NULL;
CREATE UNIQUE INDEX "student_curriculum_unq_identity_gear_curriculum" ON "student_curriculum" USING btree ("person_id","curriculum_id","gear_type_id") WHERE "student_curriculum"."deleted_at" IS NULL;
ALTER TABLE "student_completed_competency" DROP CONSTRAINT "student_completed_competency_pk";
--> statement-breakpoint
ALTER TABLE "student_completed_competency" ADD CONSTRAINT "student_completed_competency_pk" PRIMARY KEY("student_curriculum_id","curriculum_module_competency_id","certificate_id");
COMMENT ON COLUMN "student_completed_competency"."is_merge_conflict_duplicate" IS 'True only for duplicate competency rows preserved during person-merge conflict resolution.';