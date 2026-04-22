// Public surface of the Leercoach chat model.
//
// Usage:
//   import { Leercoach } from "@nawadi/core";
//   const { chatId } = await Leercoach.Chat.create({ userId, profielId, scope });
//   const chat = await Leercoach.Chat.getById({ chatId, userId });
//   await Leercoach.Message.save({ chatId, role: "user", parts: [...] });
//
// The namespaced `Chat` / `Message` exports keep call sites self-documenting
// and mirror the pattern used by AiCorpus.

export * as Chat from "./chat.js";
export { leercoachChatScopeSchema } from "./chat.js";
export * as Message from "./message.js";
export * as Portfolio from "./portfolio.js";
export { leercoachPortfolioScopeSchema } from "./portfolio.js";
