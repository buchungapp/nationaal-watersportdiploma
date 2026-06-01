const SYSTEM_ADMIN_EMAILS: readonly string[] = [
  "maurits@buchung.nl",
  "jeroen@buchung.nl",
  "info@nationaalwatersportdiploma.nl",
];

// Penningmeester (treasurer) allowlist. The treasurer is an association board
// volunteer, NOT a Buchung sysadmin, so they get their own least-privilege door
// to the financial report only (see canViewFinancialReport + the /penningmeester
// middleware branch). Add the board treasurer's email below.
//
//   PENNINGMEESTER_EMAILS = ["penningmeester@nationaalwatersportdiploma.nl"]
//
// Comparison is normalized (lowercase + trim) so a casing/whitespace difference
// in the stored email cannot silently lock the treasurer out.
const PENNINGMEESTER_EMAILS: readonly string[] = [];

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
  return isEmailInAllowlist(email, PENNINGMEESTER_EMAILS);
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
