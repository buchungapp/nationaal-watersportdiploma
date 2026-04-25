CREATE SCHEMA "better_auth";

CREATE TABLE "better_auth"."account" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_id_pk" PRIMARY KEY("id")
);

CREATE TABLE "better_auth"."rate_limit" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"key" text NOT NULL,
	"count" bigint NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_id_pk" PRIMARY KEY("id")
);

CREATE TABLE "better_auth"."session" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_id_pk" PRIMARY KEY("id")
);

CREATE TABLE "better_auth"."user" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_id_pk" PRIMARY KEY("id")
);

CREATE TABLE "better_auth"."verification" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_id_pk" PRIMARY KEY("id")
);

ALTER TABLE "user" DROP CONSTRAINT "user_auth_user_id_fk";

ALTER TABLE "better_auth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "better_auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "better_auth_account_provider_account_idx" ON "better_auth"."account" USING btree ("provider_id","account_id");
CREATE INDEX "better_auth_account_user_id_idx" ON "better_auth"."account" USING btree ("user_id");
CREATE UNIQUE INDEX "better_auth_rate_limit_key_idx" ON "better_auth"."rate_limit" USING btree ("key");
CREATE UNIQUE INDEX "better_auth_session_token_idx" ON "better_auth"."session" USING btree ("token");
CREATE INDEX "better_auth_session_user_id_idx" ON "better_auth"."session" USING btree ("user_id");
CREATE UNIQUE INDEX "better_auth_user_email_idx" ON "better_auth"."user" USING btree ("email");
CREATE INDEX "better_auth_verification_identifier_idx" ON "better_auth"."verification" USING btree ("identifier");
-- Backfill: copy every public.user row (and its linked auth.users row) into
-- better_auth.user, preserving the auth_user_id UUID so the re-pointed FK stays valid
-- and no downstream table (person.userId, token.userId, etc.) needs updating.
INSERT INTO "better_auth"."user" ("id", "email", "name", "email_verified", "created_at", "updated_at")
SELECT
  pu."auth_user_id",
  pu."email",
  COALESCE(pu."display_name", NULLIF(split_part(pu."email", '@', 1), ''), 'User'),
  true,
  COALESCE(au."created_at", now()),
  COALESCE(au."updated_at", au."created_at", now())
FROM "user" pu
LEFT JOIN "auth"."users" au ON au."id" = pu."auth_user_id";

ALTER TABLE "user" ADD CONSTRAINT "user_auth_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "better_auth"."user"("id") ON DELETE no action ON UPDATE no action;