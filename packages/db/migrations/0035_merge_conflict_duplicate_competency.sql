ALTER TABLE "student_completed_competency" ADD COLUMN "is_merge_conflict_duplicate" boolean DEFAULT false NOT NULL;
ALTER TABLE "student_completed_competency" DROP CONSTRAINT "student_completed_competency_pk";
ALTER TABLE "student_completed_competency" ADD CONSTRAINT "student_completed_competency_pk" PRIMARY KEY("student_curriculum_id","curriculum_module_competency_id","certificate_id");
CREATE UNIQUE INDEX "student_completed_competency_unq_active_non_merge" ON "student_completed_competency" USING btree ("student_curriculum_id","curriculum_module_competency_id") WHERE ("is_merge_conflict_duplicate" = false AND "deleted_at" IS NULL);
COMMENT ON COLUMN "student_completed_competency"."is_merge_conflict_duplicate" IS 'True only for duplicate competency rows preserved during person-merge conflict resolution.';
