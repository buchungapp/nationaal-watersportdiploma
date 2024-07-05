ALTER TABLE "certificate" ADD COLUMN "cohort_allocation_id" uuid;
ALTER TABLE "cohort_allocation" ADD COLUMN "instructor_id" uuid;
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
