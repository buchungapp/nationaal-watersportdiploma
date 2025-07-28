import { SECRETARIAAT_EMAILS } from "~/constants";

export function isSecretariaat(userEmail?: string | null) {
  return userEmail && SECRETARIAAT_EMAILS.includes(userEmail);
}
