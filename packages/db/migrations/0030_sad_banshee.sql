CREATE SCHEMA "kss";

CREATE TYPE "public"."kwalificatie_verkregen_reden" AS ENUM('pvb_behaald', 'pvb_instructiegroep_basis', 'onbekend');
CREATE TYPE "kss"."aanvraag_status" AS ENUM('concept', 'wacht_op_voorwaarden', 'gereed_voor_beoordeling', 'in_beoordeling', 'afgerond', 'ingetrokken', 'afgebroken');
CREATE TYPE "kss"."beoordelaar_beschikbaarheidsstatus" AS ENUM('geinteresseerd', 'toegewezen', 'afgewezen_door_beoordelaar', 'afgewezen_door_secretariaat', 'afgewezen_door_vaarlocatie', 'ingetrokken');
CREATE TYPE "kss"."leercoach_toestemming_status" AS ENUM('gevraagd', 'gegeven', 'geweigerd', 'herroepen');
CREATE TYPE "kss"."pvb_aanvraag_type" AS ENUM('intern', 'extern');
CREATE TYPE "kss"."pvb_gebeurtenis_type" AS ENUM('aanvraag_ingediend', 'leercoach_toestemming_gevraagd', 'leercoach_toestemming_gegeven', 'leercoach_toestemming_geweigerd', 'voorwaarden_voltooid', 'beoordeling_gestart', 'beoordeling_afgerond', 'aanvraag_ingetrokken', 'onderdeel_toegevoegd', 'onderdeel_beoordelaar_gewijzigd', 'onderdeel_uitslag_gewijzigd');
CREATE TYPE "kss"."pvb_onderdeel_uitslag" AS ENUM('behaald', 'niet_behaald', 'nog_niet_bekend');
CREATE TYPE "kss"."kerntaakOnderdeelType" AS ENUM('portfolio', 'praktijk');
CREATE TYPE "kss"."kerntaakType" AS ENUM('verplicht', 'facultatief');
CREATE TYPE "kss"."richting" AS ENUM('trainer-coach', 'instructeur', 'official', 'opleider');
CREATE TABLE "kss"."instructie_groep" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"title" text NOT NULL,
	"richting" "kss"."richting" NOT NULL
);

CREATE TABLE "kss"."instructie_groep_cursus" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"instructie_groep_id" uuid NOT NULL,
	"course_id" uuid NOT NULL
);

CREATE TABLE "kss"."persoon_kwalificatie" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"direct_behaalde_pvb_onderdeel_id" uuid,
	"afgeleide_pvb_onderdeel_id" uuid,
	"course_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"kerntaak_onderdeel_id" uuid NOT NULL,
	"verkregen_reden" "kwalificatie_verkregen_reden" DEFAULT 'onbekend' NOT NULL,
	"toegevoegd_op" timestamp with time zone,
	"toegevoegd_door" uuid,
	"opmerkingen" text,
	CONSTRAINT "verkregen_reden_pvb_behaald_constraint" CHECK (("kss"."persoon_kwalificatie"."verkregen_reden" != 'pvb_behaald') OR ("kss"."persoon_kwalificatie"."direct_behaalde_pvb_onderdeel_id" IS NOT NULL AND "kss"."persoon_kwalificatie"."afgeleide_pvb_onderdeel_id" IS NULL)),
	CONSTRAINT "verkregen_reden_pvb_instructiegroep_basis_constraint" CHECK (("kss"."persoon_kwalificatie"."verkregen_reden" != 'pvb_instructiegroep_basis') OR ("kss"."persoon_kwalificatie"."afgeleide_pvb_onderdeel_id" IS NOT NULL AND "kss"."persoon_kwalificatie"."direct_behaalde_pvb_onderdeel_id" IS NULL)),
	CONSTRAINT "verkregen_reden_onbekend_constraint" CHECK (("kss"."persoon_kwalificatie"."verkregen_reden" != 'onbekend') OR ("kss"."persoon_kwalificatie"."direct_behaalde_pvb_onderdeel_id" IS NULL AND "kss"."persoon_kwalificatie"."afgeleide_pvb_onderdeel_id" IS NULL))
);

CREATE TABLE "kss"."pvb_aanvraag" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"kandidaat_id" uuid NOT NULL,
	"locatie_id" uuid NOT NULL,
	"type" "kss"."pvb_aanvraag_type" NOT NULL,
	"opmerkingen" text,
	CONSTRAINT "pvb_aanvraag_handle_unique" UNIQUE("handle")
);

CREATE TABLE "kss"."pvb_aanvraag_course" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_aanvraag_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"is_main_course" boolean NOT NULL,
	"opmerkingen" text
);

CREATE TABLE "kss"."pvb_aanvraag_status" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_aanvraag_id" uuid NOT NULL,
	"status" "kss"."aanvraag_status" NOT NULL,
	"aangemaakt_op" timestamp with time zone DEFAULT now(),
	"aangemaakt_door" uuid NOT NULL,
	"reden" text,
	"opmerkingen" text
);

CREATE TABLE "kss"."pvb_beoordelaar_beschikbaarheid" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_aanvraag_id" uuid NOT NULL,
	"beoordelaar_id" uuid NOT NULL,
	"pvb_voorstel_datum_id" uuid NOT NULL,
	"opmerkingen" text
);

CREATE TABLE "kss"."pvb_beoordelaar_beschikbaarheid_status" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_beoordelaar_beschikbaarheid_id" uuid NOT NULL,
	"status" "kss"."beoordelaar_beschikbaarheidsstatus" NOT NULL,
	"aangemaakt_op" timestamp with time zone DEFAULT now(),
	"aangemaakt_door" uuid NOT NULL,
	"reden" text,
	"opmerkingen" text
);

CREATE TABLE "kss"."pvb_beoordelaar_onderdeel_beschikbaarheid" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_beoordelaar_beschikbaarheid_id" uuid NOT NULL,
	"pvb_onderdeel_id" uuid NOT NULL
);

CREATE TABLE "kss"."pvb_gebeurtenis" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_aanvraag_id" uuid NOT NULL,
	"pvb_onderdeel_id" uuid,
	"gebeurtenis_type" "kss"."pvb_gebeurtenis_type" NOT NULL,
	"data" jsonb,
	"aangemaakt_op" timestamp with time zone DEFAULT now(),
	"aangemaakt_door" uuid NOT NULL,
	"reden" text,
	"opmerkingen" text
);

CREATE TABLE "kss"."pvb_leercoach_toestemming" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_aanvraag_id" uuid NOT NULL,
	"leercoach_id" uuid NOT NULL,
	"status" "kss"."leercoach_toestemming_status" NOT NULL,
	"aangemaakt_op" timestamp with time zone DEFAULT now(),
	"aangemaakt_door" uuid NOT NULL,
	"reden" text,
	"opmerkingen" text
);

CREATE TABLE "kss"."pvb_onderdeel" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_aanvraag_id" uuid NOT NULL,
	"kerntaak_onderdeel_id" uuid NOT NULL,
	"kerntaak_id" uuid NOT NULL,
	"beoordelaar_id" uuid,
	"start_datum_tijd" timestamp with time zone,
	"uitslag" "kss"."pvb_onderdeel_uitslag" DEFAULT 'nog_niet_bekend' NOT NULL,
	"opmerkingen" text,
	CONSTRAINT "pvb_onderdeel_id_kerntaak_onderdeel_id_unique" UNIQUE("id","kerntaak_onderdeel_id"),
	CONSTRAINT "pvb_onderdeel_id_kerntaak_onderdeel_id_beoordelaar_id_unique" UNIQUE("id","kerntaak_onderdeel_id","beoordelaar_id"),
	CONSTRAINT "pvb_onderdeel_id_kerntaak_id_unique" UNIQUE("id","kerntaak_id")
);

CREATE TABLE "kss"."pvb_onderdeel_beoordelingscriterium" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_onderdeel_id" uuid NOT NULL,
	"kerntaak_id" uuid NOT NULL,
	"beoordelingscriterium_id" uuid NOT NULL,
	"behaald" boolean,
	"opmerkingen" text
);

CREATE TABLE "kss"."pvb_voorstel_datum" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"pvb_aanvraag_id" uuid NOT NULL,
	"start_na" timestamp with time zone,
	"eind_voor" timestamp with time zone,
	"voorkeur" text,
	"opmerkingen" text,
	CONSTRAINT "pvb_voorstel_datum_id_pvb_aanvraag_id_unique" UNIQUE("id","pvb_aanvraag_id")
);

CREATE TABLE "kss"."beoordelingscriterium" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"werkproces_id" uuid NOT NULL,
	"kerntaak_id" uuid NOT NULL,
	"rang" integer NOT NULL,
	"omschrijving" text NOT NULL,
	CONSTRAINT "beoordelingscriterium_id_kerntaak_id_unique" UNIQUE("id","kerntaak_id")
);

CREATE TABLE "kss"."kerntaak" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"titel" text NOT NULL,
	"kwalificatieprofiel_id" uuid NOT NULL,
	"type" "kss"."kerntaakType" NOT NULL,
	"rang" integer
);

CREATE TABLE "kss"."kerntaak_onderdeel" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"kerntaak_id" uuid NOT NULL,
	"beoordelingsType" "kss"."kerntaakOnderdeelType" NOT NULL,
	CONSTRAINT "kerntaak_onderdeel_id_kerntaak_id_unique" UNIQUE("id","kerntaak_id")
);

CREATE TABLE "kss"."kwalificatieprofiel" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"titel" text NOT NULL,
	"richting" "kss"."richting" NOT NULL,
	"niveau_id" uuid NOT NULL
);

CREATE TABLE "kss"."niveau" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"rang" integer NOT NULL
);

CREATE TABLE "kss"."werkproces" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"kerntaak_id" uuid NOT NULL,
	"titel" text NOT NULL,
	"resultaat" text NOT NULL,
	"rang" integer NOT NULL,
	CONSTRAINT "werkproces_id_kerntaak_id_unique" UNIQUE("id","kerntaak_id")
);

DROP INDEX "unq_actor_type_person_location";
ALTER TABLE "actor" ALTER COLUMN "location_id" DROP NOT NULL;
ALTER TABLE "actor" ADD CONSTRAINT "unq_actor_type_person_location" UNIQUE NULLS NOT DISTINCT("type","person_id","location_id");
ALTER TABLE "actor" ADD CONSTRAINT "unq_actor_location_id_unique" UNIQUE NULLS NOT DISTINCT("id","location_id");
ALTER TABLE "kss"."instructie_groep_cursus" ADD CONSTRAINT "instructie_groep_cursus_instructie_groep_id_instructie_groep_id_fk" FOREIGN KEY ("instructie_groep_id") REFERENCES "kss"."instructie_groep"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."instructie_groep_cursus" ADD CONSTRAINT "instructie_groep_cursus_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."persoon_kwalificatie" ADD CONSTRAINT "persoon_kwalificatie_direct_behaalde_pvb_onderdeel_id_kerntaak_onderdeel_id_toegevoegd_door_pvb_onderdeel_id_kerntaak_onderdeel_id_beoordelaar_id_fk" FOREIGN KEY ("direct_behaalde_pvb_onderdeel_id","kerntaak_onderdeel_id","toegevoegd_door") REFERENCES "kss"."pvb_onderdeel"("id","kerntaak_onderdeel_id","beoordelaar_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."persoon_kwalificatie" ADD CONSTRAINT "persoon_kwalificatie_afgeleide_pvb_onderdeel_id_kerntaak_onderdeel_id_pvb_onderdeel_id_kerntaak_onderdeel_id_fk" FOREIGN KEY ("afgeleide_pvb_onderdeel_id","kerntaak_onderdeel_id") REFERENCES "kss"."pvb_onderdeel"("id","kerntaak_onderdeel_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."persoon_kwalificatie" ADD CONSTRAINT "persoon_kwalificatie_kerntaak_onderdeel_id_kerntaak_onderdeel_id_fk" FOREIGN KEY ("kerntaak_onderdeel_id") REFERENCES "kss"."kerntaak_onderdeel"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."persoon_kwalificatie" ADD CONSTRAINT "persoon_kwalificatie_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."persoon_kwalificatie" ADD CONSTRAINT "persoon_kwalificatie_toegevoegd_door_actor_id_fk" FOREIGN KEY ("toegevoegd_door") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."persoon_kwalificatie" ADD CONSTRAINT "persoon_kwalificatie_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_aanvraag" ADD CONSTRAINT "pvb_aanvraag_kandidaat_id_locatie_id_actor_id_location_id_fk" FOREIGN KEY ("kandidaat_id","locatie_id") REFERENCES "public"."actor"("id","location_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_aanvraag" ADD CONSTRAINT "pvb_aanvraag_locatie_id_location_id_fk" FOREIGN KEY ("locatie_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_aanvraag_course" ADD CONSTRAINT "pvb_aanvraag_course_pvb_aanvraag_id_pvb_aanvraag_id_fk" FOREIGN KEY ("pvb_aanvraag_id") REFERENCES "kss"."pvb_aanvraag"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_aanvraag_course" ADD CONSTRAINT "pvb_aanvraag_course_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_aanvraag_status" ADD CONSTRAINT "pvb_aanvraag_status_pvb_aanvraag_id_pvb_aanvraag_id_fk" FOREIGN KEY ("pvb_aanvraag_id") REFERENCES "kss"."pvb_aanvraag"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_aanvraag_status" ADD CONSTRAINT "pvb_aanvraag_status_aangemaakt_door_actor_id_fk" FOREIGN KEY ("aangemaakt_door") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_beoordelaar_beschikbaarheid" ADD CONSTRAINT "pvb_beoordelaar_beschikbaarheid_pvb_aanvraag_id_pvb_aanvraag_id_fk" FOREIGN KEY ("pvb_aanvraag_id") REFERENCES "kss"."pvb_aanvraag"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_beoordelaar_beschikbaarheid" ADD CONSTRAINT "pvb_beoordelaar_beschikbaarheid_beoordelaar_id_actor_id_fk" FOREIGN KEY ("beoordelaar_id") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_beoordelaar_beschikbaarheid" ADD CONSTRAINT "pvb_beoordelaar_beschikbaarheid_pvb_voorstel_datum_id_pvb_aanvraag_id_pvb_voorstel_datum_id_pvb_aanvraag_id_fk" FOREIGN KEY ("pvb_voorstel_datum_id","pvb_aanvraag_id") REFERENCES "kss"."pvb_voorstel_datum"("id","pvb_aanvraag_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_beoordelaar_beschikbaarheid_status" ADD CONSTRAINT "pvb_beoordelaar_beschikbaarheid_status_pvb_beoordelaar_beschikbaarheid_id_pvb_beoordelaar_beschikbaarheid_id_fk" FOREIGN KEY ("pvb_beoordelaar_beschikbaarheid_id") REFERENCES "kss"."pvb_beoordelaar_beschikbaarheid"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_beoordelaar_beschikbaarheid_status" ADD CONSTRAINT "pvb_beoordelaar_beschikbaarheid_status_aangemaakt_door_actor_id_fk" FOREIGN KEY ("aangemaakt_door") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_beoordelaar_onderdeel_beschikbaarheid" ADD CONSTRAINT "pvb_beoordelaar_onderdeel_beschikbaarheid_pvb_beoordelaar_beschikbaarheid_id_pvb_beoordelaar_beschikbaarheid_id_fk" FOREIGN KEY ("pvb_beoordelaar_beschikbaarheid_id") REFERENCES "kss"."pvb_beoordelaar_beschikbaarheid"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_beoordelaar_onderdeel_beschikbaarheid" ADD CONSTRAINT "pvb_beoordelaar_onderdeel_beschikbaarheid_pvb_onderdeel_id_pvb_onderdeel_id_fk" FOREIGN KEY ("pvb_onderdeel_id") REFERENCES "kss"."pvb_onderdeel"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_gebeurtenis" ADD CONSTRAINT "pvb_gebeurtenis_pvb_aanvraag_id_pvb_aanvraag_id_fk" FOREIGN KEY ("pvb_aanvraag_id") REFERENCES "kss"."pvb_aanvraag"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_gebeurtenis" ADD CONSTRAINT "pvb_gebeurtenis_pvb_onderdeel_id_pvb_onderdeel_id_fk" FOREIGN KEY ("pvb_onderdeel_id") REFERENCES "kss"."pvb_onderdeel"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_gebeurtenis" ADD CONSTRAINT "pvb_gebeurtenis_aangemaakt_door_actor_id_fk" FOREIGN KEY ("aangemaakt_door") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_leercoach_toestemming" ADD CONSTRAINT "pvb_leercoach_toestemming_pvb_aanvraag_id_pvb_aanvraag_id_fk" FOREIGN KEY ("pvb_aanvraag_id") REFERENCES "kss"."pvb_aanvraag"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_leercoach_toestemming" ADD CONSTRAINT "pvb_leercoach_toestemming_leercoach_id_actor_id_fk" FOREIGN KEY ("leercoach_id") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_leercoach_toestemming" ADD CONSTRAINT "pvb_leercoach_toestemming_aangemaakt_door_actor_id_fk" FOREIGN KEY ("aangemaakt_door") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel" ADD CONSTRAINT "pvb_onderdeel_pvb_aanvraag_id_pvb_aanvraag_id_fk" FOREIGN KEY ("pvb_aanvraag_id") REFERENCES "kss"."pvb_aanvraag"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel" ADD CONSTRAINT "pvb_onderdeel_kerntaak_onderdeel_id_kerntaak_id_kerntaak_onderdeel_id_kerntaak_id_fk" FOREIGN KEY ("kerntaak_onderdeel_id","kerntaak_id") REFERENCES "kss"."kerntaak_onderdeel"("id","kerntaak_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel" ADD CONSTRAINT "pvb_onderdeel_kerntaak_id_kerntaak_id_fk" FOREIGN KEY ("kerntaak_id") REFERENCES "kss"."kerntaak"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel" ADD CONSTRAINT "pvb_onderdeel_beoordelaar_id_actor_id_fk" FOREIGN KEY ("beoordelaar_id") REFERENCES "public"."actor"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel_beoordelingscriterium" ADD CONSTRAINT "pvb_onderdeel_beoordelingscriterium_pvb_onderdeel_id_kerntaak_id_pvb_onderdeel_id_kerntaak_id_fk" FOREIGN KEY ("pvb_onderdeel_id","kerntaak_id") REFERENCES "kss"."pvb_onderdeel"("id","kerntaak_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel_beoordelingscriterium" ADD CONSTRAINT "pvb_onderdeel_beoordelingscriterium_beoordelingscriterium_id_kerntaak_id_beoordelingscriterium_id_kerntaak_id_fk" FOREIGN KEY ("beoordelingscriterium_id","kerntaak_id") REFERENCES "kss"."beoordelingscriterium"("id","kerntaak_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_onderdeel_beoordelingscriterium" ADD CONSTRAINT "pvb_onderdeel_beoordelingscriterium_kerntaak_id_kerntaak_id_fk" FOREIGN KEY ("kerntaak_id") REFERENCES "kss"."kerntaak"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."pvb_voorstel_datum" ADD CONSTRAINT "pvb_voorstel_datum_pvb_aanvraag_id_pvb_aanvraag_id_fk" FOREIGN KEY ("pvb_aanvraag_id") REFERENCES "kss"."pvb_aanvraag"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."beoordelingscriterium" ADD CONSTRAINT "beoordelingscriterium_werkproces_id_kerntaak_id_werkproces_id_kerntaak_id_fk" FOREIGN KEY ("werkproces_id","kerntaak_id") REFERENCES "kss"."werkproces"("id","kerntaak_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."beoordelingscriterium" ADD CONSTRAINT "beoordelingscriterium_kerntaak_id_kerntaak_id_fk" FOREIGN KEY ("kerntaak_id") REFERENCES "kss"."kerntaak"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."kerntaak" ADD CONSTRAINT "kerntaak_kwalificatieprofiel_id_kwalificatieprofiel_id_fk" FOREIGN KEY ("kwalificatieprofiel_id") REFERENCES "kss"."kwalificatieprofiel"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."kerntaak_onderdeel" ADD CONSTRAINT "kerntaak_onderdeel_kerntaak_id_kerntaak_id_fk" FOREIGN KEY ("kerntaak_id") REFERENCES "kss"."kerntaak"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."kwalificatieprofiel" ADD CONSTRAINT "kwalificatieprofiel_niveau_id_niveau_id_fk" FOREIGN KEY ("niveau_id") REFERENCES "kss"."niveau"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kss"."werkproces" ADD CONSTRAINT "werkproces_kerntaak_id_kerntaak_id_fk" FOREIGN KEY ("kerntaak_id") REFERENCES "kss"."kerntaak"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "instructie_groep_cursus_course_id_index" ON "kss"."instructie_groep_cursus" USING btree ("course_id");
CREATE UNIQUE INDEX "unique_person_course_kerntaak_onderdeel" ON "kss"."persoon_kwalificatie" USING btree ("person_id","course_id","kerntaak_onderdeel_id");
CREATE UNIQUE INDEX "pvb_aanvraag_course_main_course_unique_idx" ON "kss"."pvb_aanvraag_course" USING btree ("pvb_aanvraag_id") WHERE "kss"."pvb_aanvraag_course"."is_main_course" = true;
CREATE INDEX "pvb_leercoach_toestemming_recent_idx" ON "kss"."pvb_leercoach_toestemming" USING btree ("pvb_aanvraag_id","leercoach_id","aangemaakt_op" DESC NULLS LAST);
CREATE INDEX "pvb_leercoach_toestemming_status_idx" ON "kss"."pvb_leercoach_toestemming" USING btree ("pvb_aanvraag_id","leercoach_id","status");
CREATE UNIQUE INDEX "pvb_onderdeel_aanvraag_id_kerntaak_onderdeel_id_beoordelaar_id_unique" ON "kss"."pvb_onderdeel" USING btree ("pvb_aanvraag_id","kerntaak_onderdeel_id","beoordelaar_id");
CREATE UNIQUE INDEX "pvb_onderdeel_aanvraag_id_kerntaak_onderdeel_id_unique" ON "kss"."pvb_onderdeel" USING btree ("pvb_aanvraag_id","kerntaak_onderdeel_id");
CREATE UNIQUE INDEX "pvb_onderdeel_aanvraag_id_kerntaak_id_unique" ON "kss"."pvb_onderdeel" USING btree ("pvb_aanvraag_id","kerntaak_id");
ALTER TABLE "public"."actor" ALTER COLUMN "type" SET DATA TYPE text;
DROP TYPE "public"."actor_type";
CREATE TYPE "public"."actor_type" AS ENUM('student', 'instructor', 'location_admin', 'system', 'pvb_beoordelaar', 'secretariaat');
ALTER TABLE "public"."actor" ALTER COLUMN "type" SET DATA TYPE "public"."actor_type" USING "type"::"public"."actor_type";