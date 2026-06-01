const SYSTEM_ADMIN_EMAILS: readonly string[] = [
  "maurits@buchung.nl",
  "jeroen@buchung.nl",
  "info@nationaalwatersportdiploma.nl",
];

// Penningmeester (treasurer) allowlist. The treasurer is an association board
// volunteer, NOT a Buchung sysadmin, so they get their own least-privilege door
// to the financial report only (see canViewFinancialReport + the /penningmeester
// middleware branch).
//
// The canonical treasurer role mailbox is built in (mirrors how isSystemAdmin
// hardcodes role mailboxes). Extra emails can be added per environment via the
// PENNINGMEESTER_EMAILS env var (comma-separated) without a code deploy.
// Comparison is normalized (lowercase + trim) so a casing/whitespace difference
// in the stored email cannot silently lock the treasurer out.
const PENNINGMEESTER_EMAILS: readonly string[] = [
  "penningmeester@nationaalwatersportdiploma.nl",
];

function getPenningmeesterEmails(): string[] {
  const fromEnv = (process.env.PENNINGMEESTER_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return [...PENNINGMEESTER_EMAILS, ...fromEnv];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Case/whitespace-insensitive allowlist membership check. Exported so the
 * allowlist logic can be unit-tested independently of any specific list.
 */
export function isEmailInAllowlist(
  email: string | null | undefined,
  allowlist: readonly string[],
): boolean {
  if (!email) {
    return false;
  }
  const normalized = normalizeEmail(email);
  return allowlist.some((entry) => normalizeEmail(entry) === normalized);
}

export function isSystemAdmin(email: string | null | undefined): boolean {
  return !!email && SYSTEM_ADMIN_EMAILS.includes(email);
}

export function isPenningmeester(email: string | null | undefined): boolean {
  return isEmailInAllowlist(email, getPenningmeesterEmails());
}

/**
 * Who may see the penningmeester (financial) report: the treasurer, or any
 * sysadmin (so Buchung can view/support it too). This is the gate enforced in
 * both the middleware branch and inside each report server action.
 */
export function canViewFinancialReport(
  email: string | null | undefined,
): boolean {
  return isPenningmeester(email) || isSystemAdmin(email);
}
