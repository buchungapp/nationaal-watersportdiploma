DO $$ BEGIN
 CREATE TYPE "competency_type" AS ENUM('knowledge', 'skill');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "competency" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"type" "competency_type" NOT NULL,
	CONSTRAINT "competency_handle_unique" UNIQUE("handle")
);

CREATE TABLE IF NOT EXISTS "module" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	CONSTRAINT "module_handle_unique" UNIQUE("handle")
);

CREATE TABLE IF NOT EXISTS "discipline" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	CONSTRAINT "discipline_handle_unique" UNIQUE("handle")
);

CREATE TABLE IF NOT EXISTS "degree" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"rang" smallint NOT NULL,
	CONSTRAINT "degree_handle_unique" UNIQUE("handle")
);

CREATE TABLE IF NOT EXISTS "category" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"parent_category_id" uuid,
	"handle" text NOT NULL,
	"title" text,
	"description" text,
	CONSTRAINT "category_handle_unique" UNIQUE("handle")
);

CREATE TABLE IF NOT EXISTS "program" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"discipline_id" uuid NOT NULL,
	"degree_id" uuid NOT NULL,
	CONSTRAINT "program_handle_unique" UNIQUE("handle"),
	CONSTRAINT "program_degree_id_discipline_id_unique" UNIQUE("degree_id","discipline_id")
);

CREATE TABLE IF NOT EXISTS "program_category" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"program_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "program_category_category_id_program_id_unique" UNIQUE("category_id","program_id")
);

CREATE TABLE IF NOT EXISTS "program_revision" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"program_id" uuid NOT NULL,
	"revision" text NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "program_revision_program_id_revision_unique" UNIQUE("program_id","revision")
);

CREATE TABLE IF NOT EXISTS "program_module" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"program_revision_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	CONSTRAINT "program_module_program_revision_id_module_id_unique" UNIQUE("program_revision_id","module_id")
);

CREATE TABLE IF NOT EXISTS "program_module_competency" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"program_module_id" uuid NOT NULL,
	"competency_id" uuid NOT NULL,
	"is_required" boolean NOT NULL,
	"requirement" text,
	CONSTRAINT "program_module_competency_program_module_id_competency_id_unique" UNIQUE("program_module_id","competency_id")
);

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
 ALTER TABLE "program_revision" ADD CONSTRAINT "program_revision_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "program_module" ADD CONSTRAINT "program_module_program_revision_id_fk" FOREIGN KEY ("program_revision_id") REFERENCES "program_revision"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "program_module" ADD CONSTRAINT "program_module_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "program_module_competency" ADD CONSTRAINT "module_competency_program_module_id_fk" FOREIGN KEY ("program_module_id") REFERENCES "program_module"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "program_module_competency" ADD CONSTRAINT "module_competency_competency_id_fk" FOREIGN KEY ("competency_id") REFERENCES "competency"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
