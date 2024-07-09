ALTER TABLE "media" ADD COLUMN "name" text;
ALTER TABLE "media" ADD COLUMN "description" text;
ALTER TABLE "media" ADD COLUMN "tags" text[] DEFAULT ARRAY[]::text[] NOT NULL;