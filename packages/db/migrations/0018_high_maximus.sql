DROP INDEX IF EXISTS "cohort_handle_index";
CREATE UNIQUE INDEX IF NOT EXISTS "cohort_handle_location_id_index" ON "cohort" USING btree ("handle","location_id") WHERE deleted_at IS NULL;