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

 INSERT INTO privilege (handle,  description)
    VALUES 
      ('accredit_certificate', 'Can accredit certificates in a cohort'),
    ON CONFLICT (handle) DO UPDATE 
    SET description = EXCLUDED.description;