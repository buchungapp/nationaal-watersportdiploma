ALTER TABLE "cohort_allocation" DROP CONSTRAINT "cohort_allocation_instructor_id_fk";

DO $$ BEGIN
 ALTER TABLE "cohort_allocation" ADD CONSTRAINT "cohort_allocation_instructor_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
