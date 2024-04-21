DO $$ BEGIN
 CREATE TYPE "media_status" AS ENUM('failed', 'processing', 'ready', 'uploaded', 'corrupt');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "media_type" AS ENUM('image', 'file');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "competency_type" AS ENUM('knowledge', 'skill');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "identity_type" AS ENUM('student', 'instructor', 'location_admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "identity_link_status" AS ENUM('pending', 'accepted', 'rejected', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "location_link_permission_level" AS ENUM('pii_only', 'all');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "student_curriculum" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"identity_id" uuid NOT NULL,
	"curriculum_id" uuid NOT NULL,
	"gear_type_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "certificate" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"student_curriculum_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"issued_at" timestamp with time zone,
	"visible_from" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "student_completed_competency" (
	"student_curriculum_id" uuid NOT NULL,
	"curriculum_module_competency_id" uuid NOT NULL,
	"certificate_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "student_completed_competency_pk" PRIMARY KEY("student_curriculum_id","curriculum_module_competency_id")
);

CREATE TABLE IF NOT EXISTS "curriculum" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"program_id" uuid NOT NULL,
	"revision" text NOT NULL,
	"started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "curriculum_module" (
	"curriculum_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "curriculum_module_curriculum_id_module_id_pk" PRIMARY KEY("curriculum_id","module_id")
);

CREATE TABLE IF NOT EXISTS "curriculum_competency" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"curriculum_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"competency_id" uuid NOT NULL,
	"is_required" boolean NOT NULL,
	"requirement" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "curriculum_gear_link" (
	"curriculum_id" uuid NOT NULL,
	"gear_type_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "curriculum_gear_link_curriculum_id_gear_type_id_pk" PRIMARY KEY("curriculum_id","gear_type_id")
);

CREATE TABLE IF NOT EXISTS "location" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"name" text,
	"logo_media_id" uuid,
	"square_logo_media_id" uuid,
	"certificate_media_id" uuid,
	"website_url" text,
	"short_description" text,
	"_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "media" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"alt" text,
	"mime_type" text,
	"status" "media_status" NOT NULL,
	"type" "media_type" NOT NULL,
	"size" bigint DEFAULT 0 NOT NULL,
	"object_id" uuid NOT NULL,
	"identity_id" uuid,
	"location_id" uuid,
	"_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "country" (
	"id" integer PRIMARY KEY NOT NULL,
	"ar" text DEFAULT '' NOT NULL,
	"bg" text DEFAULT '' NOT NULL,
	"cs" text DEFAULT '' NOT NULL,
	"da" text DEFAULT '' NOT NULL,
	"de" text DEFAULT '' NOT NULL,
	"el" text DEFAULT '' NOT NULL,
	"en" text DEFAULT '' NOT NULL,
	"es" text DEFAULT '' NOT NULL,
	"et" text DEFAULT '' NOT NULL,
	"eu" text DEFAULT '' NOT NULL,
	"fi" text DEFAULT '' NOT NULL,
	"fr" text DEFAULT '' NOT NULL,
	"hu" text DEFAULT '' NOT NULL,
	"it" text DEFAULT '' NOT NULL,
	"ja" text DEFAULT '' NOT NULL,
	"ko" text DEFAULT '' NOT NULL,
	"lt" text DEFAULT '' NOT NULL,
	"nl" text DEFAULT '' NOT NULL,
	"no" text DEFAULT '' NOT NULL,
	"pl" text DEFAULT '' NOT NULL,
	"pt" text DEFAULT '' NOT NULL,
	"ro" text DEFAULT '' NOT NULL,
	"ru" text DEFAULT '' NOT NULL,
	"sk" text DEFAULT '' NOT NULL,
	"sv" text DEFAULT '' NOT NULL,
	"th" text DEFAULT '' NOT NULL,
	"uk" text DEFAULT '' NOT NULL,
	"zh" text DEFAULT '' NOT NULL,
	"zh-tw" text DEFAULT '' NOT NULL,
	"alpha_2" char(2) DEFAULT '' NOT NULL,
	"alpha_3" char(3) DEFAULT '' NOT NULL
);

CREATE TABLE IF NOT EXISTS "competency" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"type" "competency_type" NOT NULL,
	"weight" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "module" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"weight" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "discipline" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"weight" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "degree" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"rang" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "category" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"parent_category_id" uuid,
	"handle" text NOT NULL,
	"title" text,
	"description" text,
	"weight" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "program" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"discipline_id" uuid NOT NULL,
	"degree_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "program_category" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"program_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "gear_type" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "student_competency_progress" (
	"student_curriculum_id" uuid NOT NULL,
	"curriculum_module_competency_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"progress" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "student_competency_progress_pk" PRIMARY KEY("student_curriculum_id","curriculum_module_competency_id","location_id")
);

CREATE TABLE IF NOT EXISTS "user" (
	"auth_user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"_metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "identity" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"type" "identity_type" NOT NULL,
	"user_id" uuid,
	"first_name" text,
	"last_name_prefix" text,
	"last_name" text,
	"date_of_birth" date,
	"birth_city" text,
	"birth_country" char(2),
	"_metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "identity_location_link" (
	"identity_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"status" "identity_link_status" NOT NULL,
	"permission_level" "location_link_permission_level" NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "identity_location_link_identity_id_location_id_pk" PRIMARY KEY("identity_id","location_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_curriculum_unq_identity_gear_curriculum" ON "student_curriculum" ("identity_id","curriculum_id","gear_type_id");
CREATE UNIQUE INDEX IF NOT EXISTS "certificate_unq_handle" ON "certificate" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "curriculum_program_id_revision_index" ON "curriculum" ("program_id","revision");
CREATE UNIQUE INDEX IF NOT EXISTS "curriculum_module_curriculum_id_module_id_index" ON "curriculum_module" ("curriculum_id","module_id");
CREATE UNIQUE INDEX IF NOT EXISTS "curriculum_competency_unq_set" ON "curriculum_competency" ("curriculum_id","module_id","competency_id");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_handle_for_location" ON "location" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "country_alpha_2_is_unique" ON "country" ("alpha_2");
CREATE UNIQUE INDEX IF NOT EXISTS "country_alpha_3_is_unique" ON "country" ("alpha_3");
CREATE UNIQUE INDEX IF NOT EXISTS "competency_handle_index" ON "competency" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "competency_weight_index" ON "competency" ("weight");
CREATE UNIQUE INDEX IF NOT EXISTS "module_handle_index" ON "module" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "module_weight_index" ON "module" ("weight");
CREATE UNIQUE INDEX IF NOT EXISTS "discipline_handle_index" ON "discipline" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "discipline_weight_index" ON "discipline" ("weight");
CREATE UNIQUE INDEX IF NOT EXISTS "degree_handle_index" ON "degree" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "degree_rang_index" ON "degree" ("rang");
CREATE UNIQUE INDEX IF NOT EXISTS "category_handle_index" ON "category" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "program_handle_index" ON "program" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "program_category_category_id_program_id_index" ON "program_category" ("category_id","program_id");
CREATE UNIQUE INDEX IF NOT EXISTS "gear_type_handle_index" ON "gear_type" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "unq_handle" ON "identity" ("handle");
CREATE INDEX IF NOT EXISTS "user_global" ON "identity" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "one_instructor_per_auth_user" ON "identity" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "one_location_admin_per_auth_user" ON "identity" ("user_id");
DO $$ BEGIN
 ALTER TABLE "student_curriculum" ADD CONSTRAINT "student_curriculum_link_curriculum_id_gear_type_id_fk" FOREIGN KEY ("curriculum_id","gear_type_id") REFERENCES "curriculum_gear_link"("curriculum_id","gear_type_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_curriculum" ADD CONSTRAINT "student_curriculum_link_curriculum_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "curriculum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_curriculum" ADD CONSTRAINT "student_curriculum_link_gear_type_id_fk" FOREIGN KEY ("gear_type_id") REFERENCES "gear_type"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_curriculum" ADD CONSTRAINT "student_curriculum_link_identity_id_fk" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "certificate" ADD CONSTRAINT "certificate_student_curriculum_link_id_fk" FOREIGN KEY ("student_curriculum_id") REFERENCES "student_curriculum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "certificate" ADD CONSTRAINT "certificate_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_completed_competency" ADD CONSTRAINT "student_completed_competency_student_curriculum_link_id_fk" FOREIGN KEY ("student_curriculum_id") REFERENCES "student_curriculum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_completed_competency" ADD CONSTRAINT "curriculum_competency_competency_id_fk" FOREIGN KEY ("curriculum_module_competency_id") REFERENCES "curriculum_competency"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_completed_competency" ADD CONSTRAINT "student_completed_competency_certificate_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "certificate"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "curriculum_module" ADD CONSTRAINT "curriculum_module_curriculum_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "curriculum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "curriculum_module" ADD CONSTRAINT "curriculum_module_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "curriculum_competency" ADD CONSTRAINT "curriculum_competency_curriculum_module_id_fk" FOREIGN KEY ("curriculum_id","module_id") REFERENCES "curriculum_module"("curriculum_id","module_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "curriculum_competency" ADD CONSTRAINT "curriculum_competency_competency_id_fk" FOREIGN KEY ("competency_id") REFERENCES "competency"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "curriculum_gear_link" ADD CONSTRAINT "curriculum_gear_link_curriculum_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "curriculum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "curriculum_gear_link" ADD CONSTRAINT "curriculum_gear_link_gear_type_id_fk" FOREIGN KEY ("gear_type_id") REFERENCES "gear_type"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "location" ADD CONSTRAINT "location_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "location" ADD CONSTRAINT "location_square_logo_media_id_media_id_fk" FOREIGN KEY ("square_logo_media_id") REFERENCES "media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "location" ADD CONSTRAINT "location_certificate_media_id_media_id_fk" FOREIGN KEY ("certificate_media_id") REFERENCES "media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_object_id_fk" FOREIGN KEY ("object_id") REFERENCES "storage"."objects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_identity_id_fk" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "category" ADD CONSTRAINT "category_parent_category_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "program" ADD CONSTRAINT "program_discipline_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "discipline"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "program" ADD CONSTRAINT "program_degree_id_fk" FOREIGN KEY ("degree_id") REFERENCES "degree"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "program_category" ADD CONSTRAINT "program_category_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "program_category" ADD CONSTRAINT "program_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_competency_progress" ADD CONSTRAINT "student_curriculum_progress_student_curriculum_link_id_fk" FOREIGN KEY ("student_curriculum_id") REFERENCES "student_curriculum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_competency_progress" ADD CONSTRAINT "curriculum_competency_competency_id_fk" FOREIGN KEY ("curriculum_module_competency_id") REFERENCES "curriculum_competency"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_competency_progress" ADD CONSTRAINT "student_curriculum_progress_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_auth_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "identity" ADD CONSTRAINT "identity_birth_country_country_alpha_2_fk" FOREIGN KEY ("birth_country") REFERENCES "country"("alpha_2") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "identity" ADD CONSTRAINT "identity_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("auth_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "identity_location_link" ADD CONSTRAINT "identity_location_identity_id_fk" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "identity_location_link" ADD CONSTRAINT "identity_location_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
