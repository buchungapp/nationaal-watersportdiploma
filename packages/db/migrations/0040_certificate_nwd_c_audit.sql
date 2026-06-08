ALTER TABLE "certificate" ADD COLUMN "opmerkingen" text;--> statement-breakpoint
ALTER TABLE "certificate" ADD COLUMN "toegevoegd_door" uuid;--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_toegevoegd_door_fk" FOREIGN KEY ("toegevoegd_door") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
