CREATE TABLE IF NOT EXISTS "cohort" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"revision" text NOT NULL,
	"location_id" uuid NOT NULL,
	"access_start_time" timestamp with time zone NOT NULL,
	"access_end_time" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "cohort_allocation" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"cohort_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"student_curriculum_id" uuid,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "cohort_handle_index" ON "cohort" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "cohort_allocation_cohort_id_actor_id_student_curriculum_id_index" ON "cohort_allocation" ("cohort_id","actor_id","student_curriculum_id");
CREATE INDEX IF NOT EXISTS "cohort_allocation_cohort_id_tags_index" ON "cohort_allocation" ("cohort_id","tags");
DO $$ BEGIN
 ALTER TABLE "cohort" ADD CONSTRAINT "cohort_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cohort_allocation" ADD CONSTRAINT "cohort_allocation_cohort_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "cohort"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cohort_allocation" ADD CONSTRAINT "cohort_allocation_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "actor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cohort_allocation" ADD CONSTRAINT "cohort_allocation_student_curriculum_id_fk" FOREIGN KEY ("student_curriculum_id") REFERENCES "student_curriculum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
