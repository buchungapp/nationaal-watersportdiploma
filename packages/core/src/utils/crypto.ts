import { createHash } from "node:crypto";

export const hashToken = (token: string) => {
  return createHash("sha256").update(`${token}`).digest("hex");
};
