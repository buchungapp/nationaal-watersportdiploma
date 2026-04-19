CREATE SCHEMA "leercoach";

CREATE TABLE "leercoach"."chat" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"profiel_id" uuid NOT NULL,
	"scope" jsonb NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"visibility" varchar(16) DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "leercoach"."message" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"parts" jsonb NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "leercoach"."chat" ADD CONSTRAINT "chat_profiel_id_kwalificatieprofiel_id_fk" FOREIGN KEY ("profiel_id") REFERENCES "kss"."kwalificatieprofiel"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leercoach"."message" ADD CONSTRAINT "message_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "leercoach"."chat"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "chat_user_created_idx" ON "leercoach"."chat" USING btree ("user_id","created_at" DESC NULLS LAST);
CREATE INDEX "chat_profiel_idx" ON "leercoach"."chat" USING btree ("profiel_id");
CREATE INDEX "message_chat_created_idx" ON "leercoach"."message" USING btree ("chat_id","created_at");