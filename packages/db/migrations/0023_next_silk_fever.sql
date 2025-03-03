CREATE TABLE "logbook" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"person_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"departure_port" text,
	"arrival_port" text,
	"wind_power" integer,
	"wind_direction" text,
	"boat_type" text,
	"boat_length" numeric,
	"location" text,
	"sailed_nautical_miles" numeric,
	"sailed_hours_in_dark" numeric,
	"primary_role" text,
	"crew_names" text,
	"conditions" text,
	"additional_comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

ALTER TABLE "logbook" ADD CONSTRAINT "logbook_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;