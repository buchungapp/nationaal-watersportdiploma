ALTER TYPE "kss"."pvb_gebeurtenis_type" ADD VALUE 'onderdeel_startdatum_gewijzigd';
CREATE TABLE "kss"."werkproces_kerntaak_onderdeel" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"werkproces_id" uuid NOT NULL,
	"kerntaak_onderdeel_id" uuid NOT NULL,
	"kerntaak_id" uuid NOT NULL,
	CONSTRAINT "werkproces_kerntaak_onderdeel_werkproces_id_kerntaak_onderdeel_id_unique" UNIQUE("werkproces_id","kerntaak_onderdeel_id")
);

ALTER TABLE "kss"."persoon_kwalificatie" DROP CONSTRAINT "persoon_kwalificatie_direct_behaalde_pvb_onderdeel_id_kerntaak_onderdeel_id_toegevoegd_door_pvb_onderdeel_id_kerntaak_onderdeel_id_beoordelaar_id_fk";

ALTER TABLE "kss"."pvb_aanvraag" DROP CONSTRAINT "pvb_aanvraag_kandidaat_id_locatie_id_actor_id_location_id_fk";

ALTER TABLE "kss"."pvb_beoordelaar_beschikbaarheid" DROP CONSTRAINT "pvb_beoordelaar_beschikbaarheid_beoordelaar_id_actor_id_fk";

ALTER TABLE "kss"."pvb_leercoach_toestemming" DROP CONSTRAINT "pvb_leercoach_toestemming_leercoach_id_actor_id_fk";

ALTER TABLE "kss"."pvb_onderdeel" DROP CONSTRAINT "pvb_onderdeel_beoordelaar_id_actor_id_fk";

DROP INDEX "kss"."pvb_onderdeel_aanvraag_id_kerntaak_id_unique";
ALTER TABLE "kss"."beoordelingscriterium" ADD COLUMN "title" text NOT NULL;
ALTER TABLE "kss"."werkproces_kerntaak_onderdeel" ADD CONSTRAINT "werkproces_kerntaak_onderdeel_werkproces_id_kerntaak_id_werkproces_id_kerntaak_id_fk" FOREIGN KEY ("werkproces_id","kerntaak_id") REFERENCES "kss"."werkproces"("id","kerntaak_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."werkproces_kerntaak_onderdeel" ADD CONSTRAINT "werkproces_kerntaak_onderdeel_kerntaak_onderdeel_id_kerntaak_id_kerntaak_onderdeel_id_kerntaak_id_fk" FOREIGN KEY ("kerntaak_onderdeel_id","kerntaak_id") REFERENCES "kss"."kerntaak_onderdeel"("id","kerntaak_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."persoon_kwalificatie" ADD CONSTRAINT "persoon_kwalificatie_direct_behaalde_pvb_onderdeel_id_kerntaak_onderdeel_id_pvb_onderdeel_id_kerntaak_onderdeel_id_fk" FOREIGN KEY ("direct_behaalde_pvb_onderdeel_id","kerntaak_onderdeel_id") REFERENCES "kss"."pvb_onderdeel"("id","kerntaak_onderdeel_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_aanvraag" ADD CONSTRAINT "pvb_aanvraag_kandidaat_id_person_id_fk" FOREIGN KEY ("kandidaat_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_beoordelaar_beschikbaarheid" ADD CONSTRAINT "pvb_beoordelaar_beschikbaarheid_beoordelaar_id_person_id_fk" FOREIGN KEY ("beoordelaar_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_leercoach_toestemming" ADD CONSTRAINT "pvb_leercoach_toestemming_leercoach_id_person_id_fk" FOREIGN KEY ("leercoach_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel" ADD CONSTRAINT "pvb_onderdeel_beoordelaar_id_person_id_fk" FOREIGN KEY ("beoordelaar_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel_beoordelingscriterium" ADD CONSTRAINT "pvb_onderdeel_beoordelingscriterium_pvb_onderdeel_id_beoordelingscriterium_id_unique" UNIQUE("pvb_onderdeel_id","beoordelingscriterium_id");