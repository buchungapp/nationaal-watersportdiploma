import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const echoMessages = pgTable("echo_messages", {
  id: serial("id").primaryKey(),
  messageValue: text("message_value").notNull(),
});
