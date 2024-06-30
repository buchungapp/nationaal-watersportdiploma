DO $$ BEGIN
 CREATE TYPE "location_status" AS ENUM('draft', 'active', 'hidden', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "location" ADD COLUMN "status" "location_status" DEFAULT 'active' NOT NULL;