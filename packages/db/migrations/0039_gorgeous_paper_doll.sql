ALTER TYPE "ai_corpus"."domain" ADD VALUE 'artefact';
ALTER TABLE "ai_corpus"."source" ADD COLUMN "chat_id" uuid;
ALTER TABLE "ai_corpus"."source" ADD CONSTRAINT "source_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "leercoach"."chat"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "source_chat_created_idx" ON "ai_corpus"."source" USING btree ("chat_id","created_at" DESC NULLS LAST);