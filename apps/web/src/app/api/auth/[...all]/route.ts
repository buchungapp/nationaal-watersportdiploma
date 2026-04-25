import { Auth } from "@nawadi/core";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(Auth.getBetterAuth());
