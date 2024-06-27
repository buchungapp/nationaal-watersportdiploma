CREATE TABLE IF NOT EXISTS "student_cohort_progress" (
	"cohort_allocation_id" uuid NOT NULL,
	"curriculum_module_competency_id" uuid NOT NULL,
	"progress" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "student_cohort_progress_pkey" PRIMARY KEY("cohort_allocation_id","curriculum_module_competency_id")
);

DROP TABLE "student_competency_progress";
DO $$ BEGIN
 ALTER TABLE "student_cohort_progress" ADD CONSTRAINT "student_cohort_progress_cohort_allocation_id_fk" FOREIGN KEY ("cohort_allocation_id") REFERENCES "cohort_allocation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_cohort_progress" ADD CONSTRAINT "curriculum_competency_competency_id_fk" FOREIGN KEY ("curriculum_module_competency_id") REFERENCES "curriculum_competency"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
