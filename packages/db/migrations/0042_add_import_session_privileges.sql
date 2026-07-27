INSERT INTO "public"."privilege" ("id", "handle", "title", "description") VALUES
('63a4ef59-8550-4ee8-a3bd-11c8b6a78ba0', 'import-session:read', NULL, 'Kan vendor import-sessies lezen.'),
('63a4ef59-8550-4ee8-a3bd-11c8b6a78ba1', 'import-session:write', NULL, 'Kan vendor import-sessies en cohorts aanmaken of bijwerken.')
ON CONFLICT ("handle") DO UPDATE SET
  "description" = EXCLUDED."description";
