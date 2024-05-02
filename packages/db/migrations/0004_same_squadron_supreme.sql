CREATE TABLE IF NOT EXISTS "token" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"hashed_key" text NOT NULL,
	"partial_key" text NOT NULL,
	"expires" timestamp with time zone,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "token_usage" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"token_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "person_role" (
	"person_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "person_role_person_id_role_id_pk" PRIMARY KEY("person_id","role_id")
);

CREATE TABLE IF NOT EXISTS "privilege" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"description" text
);

CREATE TABLE IF NOT EXISTS "role" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"handle" text NOT NULL,
	"title" text,
	"description" text,
	"location_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "role_privilege" (
	"role_id" uuid NOT NULL,
	"privilege_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "role_privilege_pk" PRIMARY KEY("role_id","privilege_id")
);

CREATE TABLE IF NOT EXISTS "token_privilege" (
	"token_id" uuid NOT NULL,
	"privilege_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "role_privilege_pk" PRIMARY KEY("token_id","privilege_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "token_hashed_key_index" ON "token" ("hashed_key");
CREATE INDEX IF NOT EXISTS "token_usage_token_id_used_at_index" ON "token_usage" ("token_id","used_at");
CREATE UNIQUE INDEX IF NOT EXISTS "privilege_handle_index" ON "privilege" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "role_handle_index" ON "role" ("handle");
DO $$ BEGIN
 ALTER TABLE "token" ADD CONSTRAINT "token_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("auth_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "token"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "person_role" ADD CONSTRAINT "person_role_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "person_role" ADD CONSTRAINT "user_role_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "role" ADD CONSTRAINT "role_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "role_privilege" ADD CONSTRAINT "role_privilege_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "role_privilege" ADD CONSTRAINT "role_privilege_privilege_id_fk" FOREIGN KEY ("privilege_id") REFERENCES "privilege"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "token_privilege" ADD CONSTRAINT "role_privilege_token_id_fk" FOREIGN KEY ("token_id") REFERENCES "token"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "token_privilege" ADD CONSTRAINT "role_privilege_privilege_id_fk" FOREIGN KEY ("privilege_id") REFERENCES "privilege"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
