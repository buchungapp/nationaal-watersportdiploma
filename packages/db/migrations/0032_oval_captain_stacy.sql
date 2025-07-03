ALTER TABLE "kss"."pvb_aanvraag" DROP CONSTRAINT "pvb_aanvraag_kandidaat_id_locatie_id_actor_id_location_id_fk";

ALTER TABLE "kss"."pvb_leercoach_toestemming" DROP CONSTRAINT "pvb_leercoach_toestemming_leercoach_id_actor_id_fk";

DROP INDEX "pvb_onderdeel_aanvraag_id_kerntaak_id_unique";
ALTER TABLE "kss"."pvb_aanvraag" ADD CONSTRAINT "pvb_aanvraag_kandidaat_id_person_id_fk" FOREIGN KEY ("kandidaat_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_leercoach_toestemming" ADD CONSTRAINT "pvb_leercoach_toestemming_leercoach_id_person_id_fk" FOREIGN KEY ("leercoach_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;