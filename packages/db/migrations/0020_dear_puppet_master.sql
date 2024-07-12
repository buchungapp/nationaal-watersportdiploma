ALTER TABLE "person" ADD COLUMN "handle" text;
CREATE UNIQUE INDEX IF NOT EXISTS "person_unq_handle" ON "person" USING btree ("handle");