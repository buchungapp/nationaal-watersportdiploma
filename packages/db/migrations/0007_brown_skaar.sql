CREATE TABLE IF NOT EXISTS "course" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"description" text,
	"discipline_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "course_category" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"course_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

ALTER TABLE "program" ALTER COLUMN "discipline_id" DROP NOT NULL;
ALTER TABLE "program" ADD COLUMN "course_id" uuid;
CREATE UNIQUE INDEX IF NOT EXISTS "course_handle_index" ON "course" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "course_category_category_id_course_id_index" ON "course_category" ("category_id","course_id");
DO $$ BEGIN
 ALTER TABLE "program" ADD CONSTRAINT "program_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "course" ADD CONSTRAINT "course_discipline_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "discipline"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "course_category" ADD CONSTRAINT "course_category_program_id_fk" FOREIGN KEY ("course_id") REFERENCES "program"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "course_category" ADD CONSTRAINT "course_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
