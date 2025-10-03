import { SYSTEM_ADMIN_EMAILS } from "~/constants";

export function isSystemAdmin(userEmail?: string | null) {
  return userEmail && SYSTEM_ADMIN_EMAILS.includes(userEmail);
}
