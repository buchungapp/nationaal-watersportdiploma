import { schema as s } from "@nawadi/db";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

// Message parts follow the AI SDK UIMessage shape. We accept any object with
// a `type` field; the SDK adds more part types (tool-call, tool-result, etc.)
// over time and we don't want schema drift to block them.
const messagePartSchema = z
  .object({
    type: z.string().min(1),
  })
  .passthrough();

const messageRoleSchema = z.enum(["user", "assistant", "system"]);

// Compaction metadata on the synthetic summary row produced by
// POST /api/leercoach/chat/[id]/compact. Only present when this row
// IS the summary; absent on ordinary conversation turns + on
// compacted-away turns.
const compactionMetadataSchema = z
  .object({
    kind: z.literal("summary"),
    messageCount: z.number().int().min(0),
    fromCreatedAt: z.string(),
    toCreatedAt: z.string(),
    tokensSaved: z.number().int().min(0),
    preservedDraftMessageId: z.string().uuid().nullable(),
  })
  .nullable();

// ---- Save ----

export const saveMessageInput = z.object({
  chatId: uuidSchema,
  role: messageRoleSchema,
  parts: z.array(messagePartSchema).min(1),
  attachments: z.array(z.unknown()).default([]),
  /**
   * Optional stable id supplied by the caller — typically the AI SDK's
   * `responseMessage.id` (from `onFinish`) or the client-side
   * `body.message.id` (from the submit path). Providing it makes this
   * call idempotent: a subsequent save with the same id UPDATES the
   * existing row instead of inserting a duplicate.
   *
   * Omit to fall back to DB-generated UUID (fine for callers that
   * don't have an external id to reconcile against, e.g. the opening
   * message at chat creation or the informational scope-change note).
   *
   * The UPSERT semantics also cover the AI SDK's "continuation" case:
   * when the model extends an existing assistant message instead of
   * starting a new one, `responseMessage.id` equals the original
   * message's id, and we overwrite its `parts` with the extended
   * version.
   */
  id: uuidSchema.optional(),
});

export const saveMessageOutput = z.object({
  messageId: uuidSchema,
});

export const save = wrapCommand(
  "leercoach.message.save",
  withZod(saveMessageInput, saveMessageOutput, async (input) => {
    return withTransaction(async (tx) => {
      const values: typeof s.leercoachMessage.$inferInsert = {
        chatId: input.chatId,
        role: input.role,
        parts: input.parts,
        attachments: input.attachments,
      };
      if (input.id !== undefined) values.id = input.id;

      // UPSERT — no-op conflict path when id is auto-generated (every
      // auto UUID is unique); real update path when the caller passes
      // an id that already exists. `attachments` updates too so a
      // continuation that adds an attachment isn't silently dropped.
      const inserted = await tx
        .insert(s.leercoachMessage)
        .values(values)
        .onConflictDoUpdate({
          target: s.leercoachMessage.id,
          set: {
            role: input.role,
            parts: input.parts,
            attachments: input.attachments,
          },
        })
        .returning({ id: s.leercoachMessage.id })
        .then((r) => r[0]);

      if (!inserted) {
        throw new Error("Upsert leercoach.message returned no rows");
      }

      // Touch the parent chat so updatedAt reflects latest activity — drives
      // sidebar ordering without a second COUNT query.
      await tx
        .update(s.leercoachChat)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(s.leercoachChat.id, input.chatId));

      return { messageId: inserted.id };
    });
  }),
);

// ---- Read: chat history ----

export const getMessagesByChatIdInput = z.object({
  chatId: uuidSchema,
});

export const getMessagesByChatIdOutput = z.array(
  z.object({
    messageId: uuidSchema,
    role: messageRoleSchema,
    parts: z.array(messagePartSchema),
    attachments: z.array(z.unknown()),
    createdAt: z.string(),
    /**
     * Points at the synthetic compaction-summary row that replaced
     * this message in the model's context. Non-null on messages that
     * have been "folded away" by compaction — they still live in the
     * DB for audit + UI display, but aren't sent to the model.
     *
     * Null on ordinary messages (never compacted) AND on summary rows
     * themselves (they're the target, not the folded-away).
     */
    compactedIntoId: z.string().uuid().nullable(),
    /**
     * Non-null only on synthetic summary rows (the ones produced by
     * the compact endpoint). Carries UI-display bookkeeping about
     * what got folded away here.
     */
    compactionMetadata: compactionMetadataSchema,
  }),
);

/**
 * Load all messages for a chat, ordered oldest-first. Includes both
 * ordinary turns and any compaction-summary rows; callers decide what
 * to do with the compactedIntoId / compactionMetadata bookkeeping:
 *
 *   - UI rendering wants everything (plus the divider on summary rows)
 *   - The API route that sends history to the model drops rows where
 *     compactedIntoId is set, substituting the summary row in their
 *     place.
 *
 * Caller is expected to have already verified user ownership via
 * getChatById — this function deliberately does not accept userId as
 * a parameter so composition stays simple.
 */
export const getByChatId = wrapQuery(
  "leercoach.message.getByChatId",
  withZod(
    getMessagesByChatIdInput,
    getMessagesByChatIdOutput,
    async (input) => {
      const query = useQuery();
      const rows = await query
        .select({
          id: s.leercoachMessage.id,
          role: s.leercoachMessage.role,
          parts: s.leercoachMessage.parts,
          attachments: s.leercoachMessage.attachments,
          createdAt: s.leercoachMessage.createdAt,
          compactedIntoId: s.leercoachMessage.compactedIntoId,
          compactionMetadata: s.leercoachMessage.compactionMetadata,
        })
        .from(s.leercoachMessage)
        .where(eq(s.leercoachMessage.chatId, input.chatId))
        .orderBy(asc(s.leercoachMessage.createdAt));

      return rows.map((r) => ({
        messageId: r.id,
        role: r.role,
        parts: r.parts,
        attachments: r.attachments,
        createdAt: r.createdAt,
        compactedIntoId: r.compactedIntoId,
        compactionMetadata: r.compactionMetadata,
      }));
    },
  ),
);

// ---- Save compaction: atomic summary-insert + fold-away ----

export const saveCompactionInput = z.object({
  chatId: uuidSchema,
  /** Full text of the Haiku-generated summary, wrapped in <summary>…</summary>. */
  summaryText: z.string().min(1),
  /** Message ids that get their compactedIntoId set. Excludes the preserved draft. */
  compactedMessageIds: z.array(uuidSchema).min(1),
  /** Optional id of the latest-draft message preserved verbatim (NOT folded). */
  preservedDraftMessageId: uuidSchema.nullable(),
  /** Range + savings bookkeeping written onto the summary row's metadata. */
  fromCreatedAt: z.string(),
  toCreatedAt: z.string(),
  tokensSaved: z.number().int().min(0),
});

export const saveCompactionOutput = z.object({
  summaryMessageId: uuidSchema,
});

/**
 * Commit a compaction pass atomically: insert the synthetic summary
 * message AND flip `compactedIntoId` on every folded-away row to
 * point at it. Either all rows get updated or none — a partial
 * compaction would leave the chat in an inconsistent state where
 * some turns reference a non-existent summary.
 *
 * The summary row's role is "user" (not "system", since that slot is
 * reserved for the runtime system prompt). The model sees it as a
 * user turn labelled with <summary> tags; our UI renders it as a
 * divider + expandable block, not as a chat bubble.
 *
 * `preservedDraftMessageId` is a pointer only — we don't touch that
 * row. It stays a regular assistant message in the history so the
 * model can read it alongside the summary on the next turn.
 */
export const saveCompaction = wrapCommand(
  "leercoach.message.saveCompaction",
  withZod(saveCompactionInput, saveCompactionOutput, async (input) => {
    return withTransaction(async (tx) => {
      const inserted = await tx
        .insert(s.leercoachMessage)
        .values({
          chatId: input.chatId,
          role: "user",
          parts: [{ type: "text", text: input.summaryText }],
          attachments: [],
          compactionMetadata: {
            kind: "summary",
            messageCount: input.compactedMessageIds.length,
            fromCreatedAt: input.fromCreatedAt,
            toCreatedAt: input.toCreatedAt,
            tokensSaved: input.tokensSaved,
            preservedDraftMessageId: input.preservedDraftMessageId,
          },
        })
        .returning({ id: s.leercoachMessage.id })
        .then((r) => r[0]);

      if (!inserted) {
        throw new Error("Insert compaction summary returned no rows");
      }

      await tx
        .update(s.leercoachMessage)
        .set({ compactedIntoId: inserted.id })
        .where(
          and(
            eq(s.leercoachMessage.chatId, input.chatId),
            inArray(s.leercoachMessage.id, input.compactedMessageIds),
            // Defensive: never double-compact a row that was already
            // folded into an earlier summary. If we need to re-compact
            // those, we do it via a follow-up pass that targets the
            // prior summary too.
            isNull(s.leercoachMessage.compactedIntoId),
          ),
        );

      // Touch the parent chat like save() does so the sidebar order
      // reflects the activity.
      await tx
        .update(s.leercoachChat)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(s.leercoachChat.id, input.chatId));

      return { summaryMessageId: inserted.id };
    });
  }),
);
