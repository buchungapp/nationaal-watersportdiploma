-- One-time cleanup for the leercoach message-duplication bug.
--
-- Background: for chats created before the UPSERT-on-id fix to the
-- POST /api/leercoach/chat route, `onFinish` looped over the AI SDK's
-- full `messages` array (originals + response) and saved every row
-- with a fresh DB-generated UUID. Result: each logical message exists
-- N times in `leercoach.message`, where N is how many assistant turns
-- happened after it. Chats with many turns look ~20-30× inflated.
--
-- This script keeps the EARLIEST row (by created_at) for each
-- (chat_id, role, parts::text) tuple and deletes the rest. It's safe
-- to run repeatedly — subsequent runs find nothing to delete.
--
-- Run with:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f packages/db/scripts/dedup-leercoach-messages.sql
--
-- ------------------------------------------------------------------
-- Preview: how many rows would disappear per chat
-- ------------------------------------------------------------------
-- Run this first to eyeball the damage before committing.
--
-- SELECT
--   chat_id,
--   COUNT(*) AS rows_now,
--   COUNT(DISTINCT (role || '|' || parts::text)) AS rows_after,
--   COUNT(*) - COUNT(DISTINCT (role || '|' || parts::text)) AS to_delete
-- FROM leercoach.message
-- WHERE compacted_into_id IS NULL
--   AND compaction_metadata IS NULL
-- GROUP BY chat_id
-- HAVING COUNT(*) > COUNT(DISTINCT (role || '|' || parts::text))
-- ORDER BY to_delete DESC;

-- ------------------------------------------------------------------
-- Actual cleanup — wrapped in a transaction so a mistake rolls back.
-- ------------------------------------------------------------------
--
-- Scope:
--   - Skips compaction summary rows (`compaction_metadata IS NOT NULL`)
--     — those are one-of-a-kind by construction.
--   - Skips rows that are themselves compaction targets
--     (`compacted_into_id IS NOT NULL`) — if those are duplicates
--     they're already invisible to the model, and rewriting the
--     compactedIntoId pointers is more invasive than it's worth.
--   - Only runs where a strict duplicate EXISTS within the same chat.
--
-- False-positive risk:
--   A user legitimately sending the exact same text twice (e.g.
--   clicking the same starter twice across different days) would
--   collapse to one row. Rare, but worth knowing.

BEGIN;

-- Capture a summary before deletion so the log shows what happened.
SELECT
  'before' AS phase,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT chat_id) AS chats
FROM leercoach.message;

WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY chat_id, role, parts::text
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM leercoach.message
  WHERE compacted_into_id IS NULL
    AND compaction_metadata IS NULL
)
DELETE FROM leercoach.message
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

SELECT
  'after' AS phase,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT chat_id) AS chats
FROM leercoach.message;

COMMIT;
