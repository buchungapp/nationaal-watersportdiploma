-- Custom SQL migration file, put you code below! 
DO $$
DECLARE t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
    LOOP
        EXECUTE format('
            ALTER TABLE %I ENABLE ROW LEVEL SECURITY;
        ', t, t);
    END loop;
END;
$$ LANGUAGE plpgsql;

INSERT INTO "public"."privilege" ("id", "handle", "title", "description") VALUES
('31d1e72d-3ffe-4e8b-84ee-56776aecff9e', 'manage_cohort_certificate', NULL, 'Kan diploma''s accoderen.'),
('58d89590-ef55-4291-a15d-bb72442b2e5e', 'manage_cohort_instructors', NULL, 'Kan instructeurs in het cohort beheren.'),
('b1b57c68-0a0f-4d2f-ba46-444abcb04ea6', 'manage_cohort_students', NULL, 'Kan cursisten in het cohort beheren.');

INSERT INTO "public"."role" ("id", "handle", "title", "description", "location_id", "type") VALUES
('818549b8-ea60-48d7-bcb4-5ee63036ea6f', 'cohort_admin', 'Cohort Beheerder', NULL, NULL, 'cohort');

INSERT INTO "public"."role_privilege" ("role_id", "privilege_id") VALUES
('818549b8-ea60-48d7-bcb4-5ee63036ea6f', '31d1e72d-3ffe-4e8b-84ee-56776aecff9e'),
('818549b8-ea60-48d7-bcb4-5ee63036ea6f', '58d89590-ef55-4291-a15d-bb72442b2e5e'),
('818549b8-ea60-48d7-bcb4-5ee63036ea6f', 'b1b57c68-0a0f-4d2f-ba46-444abcb04ea6');
