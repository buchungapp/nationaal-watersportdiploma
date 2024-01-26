CREATE TABLE IF NOT EXISTS "main_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text
);

CREATE TABLE IF NOT EXISTS "sub_category" (
	"main_category_id" integer NOT NULL,
	"id" serial NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	CONSTRAINT "sub_category_main_category_id_id_pk" PRIMARY KEY("main_category_id","id")
);

DO $$ BEGIN
 ALTER TABLE "sub_category" ADD CONSTRAINT "sub_category_main_category_id_main_category_id_fk" FOREIGN KEY ("main_category_id") REFERENCES "main_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
