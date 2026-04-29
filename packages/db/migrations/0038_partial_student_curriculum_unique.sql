DROP INDEX "student_curriculum_unq_identity_gear_curriculum";
CREATE UNIQUE INDEX "student_curriculum_unq_identity_gear_curriculum" ON "student_curriculum" USING btree ("person_id","curriculum_id","gear_type_id") WHERE "student_curriculum"."deleted_at" IS NULL;
