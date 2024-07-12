CREATE TABLE IF NOT EXISTS "external_certificate" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"person_id" uuid NOT NULL,
	"identifier" text,
	"awarded_at" timestamp with time zone,
	"location_id" uuid,
	"_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

ALTER TABLE "person" ADD COLUMN "handle" text;
DO $$ BEGIN
 ALTER TABLE "external_certificate" ADD CONSTRAINT "external_certificate_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "external_certificate" ADD CONSTRAINT "external_certificate_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "person_unq_handle" ON "person" USING btree ("handle");