import { createHash, randomBytes } from "node:crypto";

/**
 * Hashes a token using SHA-256 algorithm
 * @param token - The token to hash
 * @returns The hashed token as a hex string
 * @throws {Error} If token is not a string
 */
export const hashToken = (token: string): string => {
  if (typeof token !== "string") {
    throw new Error("Token must be a string");
  }
  return createHash("sha256").update(token).digest("hex");
};

/**
 * Creates a random token with optional prefix
 * @param options - Configuration options for token generation
 * @param options.length - Length of the random bytes in bytes (not characters)
 * @param options.prefix - Optional prefix to prepend to the token
 * @returns The generated token
 * @throws {Error} If length is not a positive number
 */
export const createToken = ({
  length,
  prefix = "",
}: {
  length: number;
  prefix?: string;
}): string => {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Length must be a positive integer");
  }
  if (typeof prefix !== "string") {
    throw new Error("Prefix must be a string");
  }
  return `${prefix}${randomBytes(length).toString("hex")}`;
};

/**
 * Generates a PKCE code verifier
 * @returns A base64url-encoded random string
 */
export const generateCodeVerifier = (): string => {
  return randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

/**
 * Generates a PKCE code challenge from a verifier
 * @param codeVerifier - The code verifier to generate challenge from
 * @returns The base64url-encoded SHA-256 hash of the verifier
 * @throws {Error} If codeVerifier is not a string or if Web Crypto API is unavailable
 */
export const generateCodeChallengeHash = async (
  codeVerifier: string,
): Promise<string> => {
  if (typeof codeVerifier !== "string") {
    throw new Error("Code verifier must be a string");
  }

  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto API is not available");
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const base64url = hashArray
      .map((byte) => String.fromCharCode(byte))
      .join("");

    return Buffer.from(base64url, "binary")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (error) {
    throw new Error(
      `Failed to generate code challenge: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
