CREATE INDEX "certificate_idx_location" ON "certificate" USING btree ("location_id");
CREATE INDEX "certificate_idx_issued_at" ON "certificate" USING btree ("issued_at");
CREATE INDEX "certificate_idx_visible_from" ON "certificate" USING btree ("visible_from");
CREATE INDEX "certificate_idx_deleted_at" ON "certificate" USING btree ("deleted_at");
CREATE INDEX "certificate_idx_location_issued_at" ON "certificate" USING btree ("location_id","issued_at");
CREATE INDEX "certificate_idx_handle_search" ON "certificate" USING gin (to_tsvector('simple', "handle"));
CREATE INDEX "student_curriculum_idx_person" ON "student_curriculum" USING btree ("person_id");
CREATE INDEX "person_idx_name_search" ON "person" USING gin (to_tsvector('simple', 
          COALESCE("first_name", '') || ' ' || 
          COALESCE("last_name_prefix", '') || ' ' || 
          COALESCE("last_name", '')
        ));
CREATE INDEX "person_idx_first_name" ON "person" USING btree ("first_name");
CREATE INDEX "person_idx_last_name" ON "person" USING btree ("last_name");