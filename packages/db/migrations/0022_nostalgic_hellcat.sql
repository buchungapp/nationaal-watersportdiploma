ALTER TABLE "external_certificate" ADD COLUMN "issuing_authority" text;
ALTER TABLE "external_certificate" ADD COLUMN "title" text NOT NULL;
ALTER TABLE "external_certificate" ADD COLUMN "issuing_location" text;
ALTER TABLE "external_certificate" ADD COLUMN "additional_comments" text;
ALTER TABLE "external_certificate" ADD COLUMN "media_id" uuid;
ALTER TABLE "external_certificate" ADD CONSTRAINT "external_certificate_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;

UPDATE
    "external_certificate"
SET
    "issuing_authority" = _metadata ->> 'Uitgever',
    "title" = _metadata ->> 'Opleiding',
    "_metadata" = _metadata - 'Uitgever' - 'Opleiding';
