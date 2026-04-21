-- Backfill leercoach.portfolio for chats that predate the portfolio
-- model. For each chat without a portfolio_id:
--
--   1. Resolve-or-create the user's portfolio for (user_id, profiel_id,
--      scope). This collapses N legacy chats about the same portfolio
--      into one portfolio row.
--   2. Attach the chat via chat.portfolio_id = portfolio.id.
--   3. Import the chat's longest assistant text message as version 1
--      (created_by='imported') so the doc pane isn't empty when a
--      kandidaat opens an old chat.
--
-- Step 3 uses the same "latest-long-draft" heuristic the compaction
-- path relies on: we assume the longest assistant text is the most
-- complete version of the portfolio draft. The message id is captured
-- so `portfolio_version.created_by_message_id` links back to it.
--
-- Safe to run multiple times: every step is conditional on the
-- absence of an existing pointer.

BEGIN;

SELECT
  'before' AS phase,
  COUNT(*) FILTER (WHERE portfolio_id IS NULL) AS chats_without_portfolio,
  (SELECT COUNT(*) FROM leercoach.portfolio) AS portfolios,
  (SELECT COUNT(*) FROM leercoach.portfolio_version) AS versions
FROM leercoach.chat;

-- Step 1-2: create missing portfolios + attach chats.
--
-- The WITH here handles the resolve-or-create atomically per chat. For
-- each chat missing a portfolio_id, check whether a portfolio already
-- exists for this (user, profiel, scope) — if so, link; if not, insert
-- one. Scope is jsonb so we compare with the jsonb = operator, which
-- normalizes key order and is stable across Postgres versions.

WITH chats_to_fix AS (
  SELECT id, user_id, profiel_id, scope, title
  FROM leercoach.chat
  WHERE portfolio_id IS NULL AND deleted_at IS NULL
),
existing_portfolios AS (
  SELECT
    c.id AS chat_id,
    p.id AS portfolio_id
  FROM chats_to_fix c
  JOIN leercoach.portfolio p
    ON p.user_id = c.user_id
   AND p.profiel_id = c.profiel_id
   AND p.scope = c.scope
   AND p.deleted_at IS NULL
),
new_portfolios AS (
  INSERT INTO leercoach.portfolio (user_id, profiel_id, scope, title)
  SELECT c.user_id, c.profiel_id, c.scope, c.title
  FROM chats_to_fix c
  WHERE NOT EXISTS (
    SELECT 1 FROM existing_portfolios ep WHERE ep.chat_id = c.id
  )
  ON CONFLICT DO NOTHING
  RETURNING id, user_id, profiel_id, scope
),
all_resolutions AS (
  SELECT c.id AS chat_id, ep.portfolio_id
  FROM chats_to_fix c
  JOIN existing_portfolios ep ON ep.chat_id = c.id
  UNION ALL
  SELECT c.id AS chat_id, np.id AS portfolio_id
  FROM chats_to_fix c
  JOIN new_portfolios np
    ON np.user_id = c.user_id
   AND np.profiel_id = c.profiel_id
   AND np.scope = c.scope
)
UPDATE leercoach.chat ch
SET portfolio_id = ar.portfolio_id
FROM all_resolutions ar
WHERE ch.id = ar.chat_id;

-- Step 3: import longest assistant text message per portfolio as v1,
-- ONLY when the portfolio has no version yet. The "longest" rule
-- mirrors the compaction-path heuristic — in legacy chats the final
-- full-portfolio regenerate tends to be the biggest message.
--
-- We use DISTINCT ON to pick one message per portfolio in a single
-- scan: order by content length descending within each portfolio,
-- take the top row. The sub-select extracts text from the jsonb
-- parts array via jsonb_array_elements.

WITH portfolio_chats AS (
  SELECT DISTINCT ch.portfolio_id
  FROM leercoach.chat ch
  WHERE ch.portfolio_id IS NOT NULL
    AND ch.deleted_at IS NULL
),
eligible_messages AS (
  SELECT
    ch.portfolio_id,
    m.id AS message_id,
    (
      SELECT string_agg(part->>'text', E'\n\n')
      FROM jsonb_array_elements(m.parts) AS part
      WHERE part->>'type' = 'text'
    ) AS content,
    m.created_at
  FROM leercoach.chat ch
  JOIN leercoach.message m ON m.chat_id = ch.id
  WHERE ch.portfolio_id IS NOT NULL
    AND m.role = 'assistant'
    AND m.compacted_into_id IS NULL
    AND m.compaction_metadata IS NULL
),
ranked AS (
  SELECT
    em.portfolio_id,
    em.message_id,
    em.content,
    em.created_at,
    LENGTH(COALESCE(em.content, '')) AS content_length,
    ROW_NUMBER() OVER (
      PARTITION BY em.portfolio_id
      ORDER BY LENGTH(COALESCE(em.content, '')) DESC, em.created_at DESC
    ) AS rn
  FROM eligible_messages em
  WHERE em.content IS NOT NULL AND LENGTH(em.content) > 0
)
INSERT INTO leercoach.portfolio_version (
  portfolio_id,
  content,
  content_hash,
  created_by,
  created_by_message_id,
  change_note
)
SELECT
  r.portfolio_id,
  r.content,
  encode(sha256(r.content::bytea), 'hex'),
  'imported'::leercoach.portfolio_version_created_by,
  r.message_id,
  'Geïmporteerd uit chat-historie (langste assistant-bericht).'
FROM ranked r
JOIN leercoach.portfolio p ON p.id = r.portfolio_id
WHERE r.rn = 1
  AND p.current_version_id IS NULL   -- only seed portfolios with no versions
  AND r.content_length >= 200        -- filter out trivial one-liners
ON CONFLICT (portfolio_id, content_hash) DO NOTHING;

-- Bump current_version_id on the freshly-seeded portfolios to point at
-- their imported v1.
UPDATE leercoach.portfolio p
SET current_version_id = pv.id,
    updated_at = now()
FROM leercoach.portfolio_version pv
WHERE pv.portfolio_id = p.id
  AND p.current_version_id IS NULL
  AND pv.deleted_at IS NULL;

SELECT
  'after' AS phase,
  COUNT(*) FILTER (WHERE portfolio_id IS NULL) AS chats_without_portfolio,
  (SELECT COUNT(*) FROM leercoach.portfolio) AS portfolios,
  (SELECT COUNT(*) FROM leercoach.portfolio_version) AS versions
FROM leercoach.chat;

COMMIT;
