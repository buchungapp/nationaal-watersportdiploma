DROP TABLE "program_category";
ALTER TABLE "program" DROP CONSTRAINT "program_discipline_id_fk";

ALTER TABLE "program" ALTER COLUMN "course_id" SET NOT NULL;
ALTER TABLE "program" DROP COLUMN IF EXISTS "discipline_id";