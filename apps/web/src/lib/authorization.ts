const SYSTEM_ADMIN_EMAILS: readonly string[] = [
  "maurits@buchung.nl",
  "jeroen@buchung.nl",
  "info@nationaalwatersportdiploma.nl",
];

export function isSystemAdmin(email: string | null | undefined): boolean {
  return !!email && SYSTEM_ADMIN_EMAILS.includes(email);
}
