CREATE TABLE "better_auth"."jwks" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "jwks_id_pk" PRIMARY KEY("id")
);

CREATE TABLE "better_auth"."oauth_access_token" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"token" text NOT NULL,
	"client_id" text NOT NULL,
	"session_id" uuid,
	"user_id" uuid,
	"reference_id" text,
	"refresh_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scopes" text[] NOT NULL,
	CONSTRAINT "oauth_access_token_id_pk" PRIMARY KEY("id")
);

CREATE TABLE "better_auth"."oauth_client" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text,
	"disabled" boolean DEFAULT false NOT NULL,
	"skip_consent" boolean,
	"enable_end_session" boolean,
	"subject_type" text,
	"scopes" text[],
	"user_id" uuid,
	"name" text,
	"uri" text,
	"icon" text,
	"contacts" text[],
	"tos" text,
	"policy" text,
	"software_id" text,
	"software_version" text,
	"software_statement" text,
	"redirect_uris" text[] NOT NULL,
	"post_logout_redirect_uris" text[],
	"token_endpoint_auth_method" text,
	"grant_types" text[],
	"response_types" text[],
	"public" boolean,
	"type" text,
	"require_pkce" boolean,
	"reference_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_client_id_pk" PRIMARY KEY("id"),
	CONSTRAINT "better_auth_oauth_client_client_id_unq" UNIQUE("client_id")
);

CREATE TABLE "better_auth"."oauth_consent" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"client_id" text NOT NULL,
	"user_id" uuid,
	"reference_id" text,
	"scopes" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_consent_id_pk" PRIMARY KEY("id")
);

CREATE TABLE "better_auth"."oauth_refresh_token" (
	"id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"token" text NOT NULL,
	"client_id" text NOT NULL,
	"session_id" uuid,
	"user_id" uuid NOT NULL,
	"reference_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked" timestamp with time zone,
	"auth_time" timestamp with time zone,
	"scopes" text[] NOT NULL,
	CONSTRAINT "oauth_refresh_token_id_pk" PRIMARY KEY("id")
);

ALTER TABLE "better_auth"."oauth_access_token" ADD CONSTRAINT "oauth_access_token_client_id_oauth_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "better_auth"."oauth_client"("client_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_access_token" ADD CONSTRAINT "oauth_access_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "better_auth"."session"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_access_token" ADD CONSTRAINT "oauth_access_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_access_token" ADD CONSTRAINT "oauth_access_token_refresh_id_oauth_refresh_token_id_fk" FOREIGN KEY ("refresh_id") REFERENCES "better_auth"."oauth_refresh_token"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_client" ADD CONSTRAINT "oauth_client_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_consent" ADD CONSTRAINT "oauth_consent_client_id_oauth_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "better_auth"."oauth_client"("client_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_consent" ADD CONSTRAINT "oauth_consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_client_id_oauth_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "better_auth"."oauth_client"("client_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "better_auth"."session"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "better_auth"."oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "better_auth_oauth_access_token_token_idx" ON "better_auth"."oauth_access_token" USING btree ("token");
CREATE INDEX "better_auth_oauth_access_token_client_id_idx" ON "better_auth"."oauth_access_token" USING btree ("client_id");
CREATE INDEX "better_auth_oauth_access_token_user_id_idx" ON "better_auth"."oauth_access_token" USING btree ("user_id");
CREATE INDEX "better_auth_oauth_access_token_refresh_id_idx" ON "better_auth"."oauth_access_token" USING btree ("refresh_id");
CREATE INDEX "better_auth_oauth_client_user_id_idx" ON "better_auth"."oauth_client" USING btree ("user_id");
CREATE INDEX "better_auth_oauth_client_reference_id_idx" ON "better_auth"."oauth_client" USING btree ("reference_id");
CREATE INDEX "better_auth_oauth_consent_client_id_idx" ON "better_auth"."oauth_consent" USING btree ("client_id");
CREATE INDEX "better_auth_oauth_consent_user_id_idx" ON "better_auth"."oauth_consent" USING btree ("user_id");
CREATE UNIQUE INDEX "better_auth_oauth_refresh_token_token_idx" ON "better_auth"."oauth_refresh_token" USING btree ("token");
CREATE INDEX "better_auth_oauth_refresh_token_client_id_idx" ON "better_auth"."oauth_refresh_token" USING btree ("client_id");
CREATE INDEX "better_auth_oauth_refresh_token_user_id_idx" ON "better_auth"."oauth_refresh_token" USING btree ("user_id");