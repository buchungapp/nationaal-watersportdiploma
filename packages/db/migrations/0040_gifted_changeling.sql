CREATE TABLE "user_acting_profile_preference" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "unq_acting_profile_user_location" UNIQUE("user_id","location_id")
);

ALTER TABLE "user_acting_profile_preference" ADD CONSTRAINT "user_acting_profile_preference_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("auth_user_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_acting_profile_preference" ADD CONSTRAINT "user_acting_profile_preference_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_acting_profile_preference" ADD CONSTRAINT "user_acting_profile_preference_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;