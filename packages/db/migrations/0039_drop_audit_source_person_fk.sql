-- The person_merge_audit table records merges; the source person row is
-- deleted by mergePersons as part of the merge transaction. Keeping a FK
-- to person(id) on source_person_id makes the audit insert fail (the
-- person is already gone) AND blocks future cleanup. The UUID is recorded
-- for forensics; the live row reference is intentionally absent.
ALTER TABLE "person_merge_audit"
  DROP CONSTRAINT IF EXISTS "person_merge_audit_source_person_id_fk";
