CREATE TABLE "location_resource_link" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"location_id" uuid NOT NULL,
	"gear_type_id" uuid,
	"discipline_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "location_resource_link_required_one_resource" CHECK ((
        (gear_type_id is not null)::int + 
        (discipline_id is not null)::int = 1
      ))
);

ALTER TABLE "location_resource_link" ADD CONSTRAINT "location_resource_link_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "location_resource_link" ADD CONSTRAINT "location_resource_link_gear_type_id_fk" FOREIGN KEY ("gear_type_id") REFERENCES "public"."gear_type"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "location_resource_link" ADD CONSTRAINT "location_resource_link_discipline_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."discipline"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "location_gear_type_unique" ON "location_resource_link" USING btree ("location_id","gear_type_id");
CREATE UNIQUE INDEX "location_discipline_unique" ON "location_resource_link" USING btree ("location_id","discipline_id");

-- Add all existing location resource links
-- Add all gear types for each location
INSERT INTO "public"."location_resource_link" ("location_id", "gear_type_id", "created_at", "updated_at")
SELECT 
    "public"."location"."id" as location_id,
    "public"."gear_type"."id" as gear_type_id,
    NOW() as created_at,
    NOW() as updated_at
FROM "public"."location"
CROSS JOIN "public"."gear_type"
WHERE "public"."location"."deleted_at" IS NULL
    AND "public"."gear_type"."deleted_at" IS NULL
ON CONFLICT ("location_id", "gear_type_id") DO NOTHING;

-- Add all disciplines for each location
INSERT INTO "public"."location_resource_link" ("location_id", "discipline_id", "created_at", "updated_at")
SELECT 
    "public"."location"."id" as location_id,
    "public"."discipline"."id" as discipline_id,
    NOW() as created_at,
    NOW() as updated_at
FROM "public"."location"
CROSS JOIN "public"."discipline"
WHERE "public"."location"."deleted_at" IS NULL
    AND "public"."discipline"."deleted_at" IS NULL
ON CONFLICT ("location_id", "discipline_id") DO NOTHING;