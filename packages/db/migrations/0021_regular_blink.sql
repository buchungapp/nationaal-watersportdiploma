ALTER TABLE "cohort" ADD COLUMN "_metadata" jsonb;
ALTER TABLE "cohort_allocation" ADD COLUMN "progress_visible_up_until" timestamp with time zone;