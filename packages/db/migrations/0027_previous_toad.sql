DROP INDEX "person_idx_first_name";
DROP INDEX "person_idx_last_name";
CREATE INDEX "person_idx_handle_search" ON "person" USING gin (to_tsvector('simple', COALESCE("handle", '')));
CREATE INDEX "person_idx_user_id" ON "person" USING btree ("user_id");
CREATE INDEX "person_idx_is_primary" ON "person" USING btree ("is_primary");
CREATE INDEX "user_idx_email_search" ON "user" USING gin (to_tsvector('simple', 
        COALESCE(split_part("email"::text, '@', 1), '') || ' ' ||
        COALESCE(split_part("email"::text, '@', 2), '')
      ));