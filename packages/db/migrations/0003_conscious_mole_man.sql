ALTER TYPE "person_location_link_status" ADD VALUE 'removed';
DROP INDEX IF EXISTS "unq_actor_type_person";
ALTER TABLE "user" ADD COLUMN "email" text NOT NULL;
ALTER TABLE "person_location_link" ADD COLUMN "removed_at" timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS "unq_actor_type_person_location" ON "actor" ("type","person_id","location_id");