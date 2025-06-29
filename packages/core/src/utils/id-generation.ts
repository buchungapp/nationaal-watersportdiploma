import { customAlphabet } from "nanoid";

export function generatePvbAanvraagID(): string {
  const dictionary = "6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz";
  const nanoid = customAlphabet(dictionary, 8);

  return nanoid();
}

export function generatePersonID(): string {
  const dictionary = "6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz";
  const nanoid = customAlphabet(dictionary, 10);

  return nanoid();
}

export function generateCertificateID() {
  const dictionary = "6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz";
  const nanoid = customAlphabet(dictionary, 10);

  return nanoid();
}
