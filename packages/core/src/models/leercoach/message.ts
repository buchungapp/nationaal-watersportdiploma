import { schema as s } from "@nawadi/db";
import { asc, eq } from "drizzle-orm";
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

// ---- Save ----

export const saveMessageInput = z.object({
  chatId: uuidSchema,
  role: messageRoleSchema,
  parts: z.array(messagePartSchema).min(1),
  attachments: z.array(z.unknown()).default([]),
});

export const saveMessageOutput = z.object({
  messageId: uuidSchema,
});

export const saveMessage = wrapCommand(
  "leercoach.message.save",
  withZod(saveMessageInput, saveMessageOutput, async (input) => {
    return withTransaction(async (tx) => {
      const inserted = await tx
        .insert(s.leercoachMessage)
        .values({
          chatId: input.chatId,
          role: input.role,
          parts: input.parts,
          attachments: input.attachments,
        })
        .returning({ id: s.leercoachMessage.id })
        .then((r) => r[0]);

      if (!inserted) {
        throw new Error("Insert leercoach.message returned no rows");
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
  }),
);

/**
 * Load all messages for a chat, ordered oldest-first. Caller is expected to
 * have already verified user ownership via getChatById — this function
 * deliberately does not accept userId as a parameter so composition stays
 * simple.
 */
export const getMessagesByChatId = wrapQuery(
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
      }));
    },
  ),
);
