CREATE SCHEMA "marketing";

CREATE TABLE "marketing"."cashback" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"applicant_full_name" text NOT NULL,
	"applicant_email" text NOT NULL,
	"applicant_iban" text NOT NULL,
	"student_full_name" text NOT NULL,
	"verification_media_id" uuid NOT NULL,
	"verification_location" text NOT NULL,
	"booking_location_id" uuid NOT NULL,
	"booking_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

ALTER TABLE "marketing"."cashback" ADD CONSTRAINT "cashback_verification_media_id_media_id_fk" FOREIGN KEY ("verification_media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "marketing"."cashback" ADD CONSTRAINT "cashback_booking_location_id_location_id_fk" FOREIGN KEY ("booking_location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;