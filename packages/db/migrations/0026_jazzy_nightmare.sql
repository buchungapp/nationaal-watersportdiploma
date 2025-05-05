DROP INDEX "person_idx_name_search";
CREATE INDEX "person_idx_name_search" ON "person" USING gin (to_tsvector('simple', 
        COALESCE("first_name", '') || ' ' || 
        COALESCE("last_name_prefix", '') || ' ' || 
        COALESCE("last_name", '')
      ));