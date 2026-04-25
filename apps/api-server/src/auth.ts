import { Auth, useDatabase } from "@nawadi/core";
import { schema as s } from "@nawadi/db";
import { eq, gt, isNull, or } from "drizzle-orm";
import { type JWK, type JWTPayload, jwtVerify } from "jose";
import { createLocalJWKSet } from "jose";

type PublicApiScope = Auth.PublicApiScope;

export interface ApiClient {
  oauthClientId: string;
  clientId: string;
  vaarschoolId: string;
  vendor: string | null;
  scopes: PublicApiScope[];
  metadata: Record<string, unknown>;
}

export class UnauthorizedError extends Error {
  constructor(
    message: string,
    public code: string = "unauthorized",
  ) {
    super(message);
  }
}

let cachedJwks: ReturnType<typeof createLocalJWKSet> | null = null;
let cachedJwksAt = 0;
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;

async function getJwks() {
  const now = Date.now();
  if (cachedJwks && now - cachedJwksAt < JWKS_CACHE_TTL_MS) {
    return cachedJwks;
  }

  const db = useDatabase();
  const rows = await db
    .select({ id: s.betterAuthJwks.id, publicKey: s.betterAuthJwks.publicKey })
    .from(s.betterAuthJwks)
    .where(
      or(
        isNull(s.betterAuthJwks.expiresAt),
        gt(s.betterAuthJwks.expiresAt, new Date()),
      ),
    );

  const keys: JWK[] = rows.map((row) => {
    const parsed = JSON.parse(row.publicKey) as JWK;
    return { ...parsed, kid: parsed.kid ?? row.id };
  });

  cachedJwks = createLocalJWKSet({ keys });
  cachedJwksAt = now;
  return cachedJwks;
}

export function clearJwksCache() {
  cachedJwks = null;
  cachedJwksAt = 0;
}

function isPublicApiScope(value: string): value is PublicApiScope {
  return (Auth.PUBLIC_API_SCOPES as readonly string[]).includes(value);
}

export async function verifyAccessToken(
  authorizationHeader: string | undefined,
  options: { issuer: string },
): Promise<{ payload: JWTPayload; client: ApiClient }> {
  if (!authorizationHeader) {
    throw new UnauthorizedError("Missing Authorization header");
  }

  const match = /^Bearer\s+([A-Za-z0-9._\-+/=]+)$/.exec(authorizationHeader);
  if (!match) {
    throw new UnauthorizedError("Malformed Authorization header");
  }

  const token = match[1];
  if (!token) {
    throw new UnauthorizedError("Empty bearer token");
  }

  const verifyOpts = {
    issuer: options.issuer,
    audience: Auth.PUBLIC_API_AUDIENCE,
    algorithms: ["EdDSA"],
    clockTolerance: "5s",
  };

  let payload: JWTPayload;
  try {
    const verified = await jwtVerify(token, await getJwks(), verifyOpts);
    payload = verified.payload;
  } catch (err) {
    // A signature failure can mean "token is bogus" or "we have a stale
    // jwks cache and just missed a rotation". Bust the cache once and
    // retry before giving up — a real bogus token still fails the second
    // round, but a freshly-rotated key now resolves.
    const looksLikeKeyMismatch =
      err instanceof Error &&
      /signature|key|kid|JWSSignatureVerificationFailed/i.test(
        `${err.name} ${err.message}`,
      );

    if (looksLikeKeyMismatch) {
      clearJwksCache();
      try {
        const verified = await jwtVerify(token, await getJwks(), verifyOpts);
        payload = verified.payload;
      } catch (retryErr) {
        throw new UnauthorizedError(
          retryErr instanceof Error ? retryErr.message : "Invalid token",
          "invalid_token",
        );
      }
    } else {
      throw new UnauthorizedError(
        err instanceof Error ? err.message : "Invalid token",
        "invalid_token",
      );
    }
  }

  const azp = payload["azp"];
  if (typeof azp !== "string") {
    throw new UnauthorizedError("Missing azp claim", "invalid_token");
  }

  const vaarschoolId = payload[Auth.VAARSCHOOL_CLAIM];
  if (typeof vaarschoolId !== "string") {
    throw new UnauthorizedError(
      "Missing vaarschool claim — client must be registered with reference_id",
      "invalid_token",
    );
  }

  const scopeClaim = payload["scope"];
  const rawScopes =
    typeof scopeClaim === "string"
      ? scopeClaim.split(/\s+/).filter(Boolean)
      : Array.isArray(scopeClaim)
        ? scopeClaim.map(String)
        : [];

  const scopes = rawScopes.filter(isPublicApiScope);

  const vendor = payload[Auth.VENDOR_CLAIM];

  const db = useDatabase();
  const clientRow = await db
    .select({
      id: s.betterAuthOauthClient.id,
      clientId: s.betterAuthOauthClient.clientId,
      metadata: s.betterAuthOauthClient.metadata,
      disabled: s.betterAuthOauthClient.disabled,
      referenceId: s.betterAuthOauthClient.referenceId,
    })
    .from(s.betterAuthOauthClient)
    .where(eq(s.betterAuthOauthClient.clientId, azp))
    .limit(1);

  const client = clientRow[0];
  if (!client) {
    throw new UnauthorizedError("Client not found", "invalid_client");
  }
  if (client.disabled) {
    throw new UnauthorizedError("Client disabled", "client_disabled");
  }

  // Defence in depth: even if a JWT carries a vaarschool claim, the bearer
  // is only ever allowed to act on the location bound to its oauth_client
  // row. This blocks cross-tenant access if the auth server is ever
  // misconfigured to mint a token with a foreign claim.
  if (!client.referenceId || client.referenceId !== vaarschoolId) {
    throw new UnauthorizedError(
      "Vaarschool claim does not match registered client",
      "invalid_token",
    );
  }

  let metadata: Record<string, unknown> = {};
  try {
    metadata = client.metadata
      ? typeof client.metadata === "string"
        ? JSON.parse(client.metadata)
        : (client.metadata as Record<string, unknown>)
      : {};
  } catch {
    metadata = {};
  }

  return {
    payload,
    client: {
      oauthClientId: client.id,
      clientId: client.clientId,
      vaarschoolId,
      vendor: typeof vendor === "string" ? vendor : null,
      scopes,
      metadata,
    },
  };
}

export class ScopeError extends Error {
  constructor(
    public required: PublicApiScope,
    public provided: PublicApiScope[],
  ) {
    super(
      `Missing required scope: ${required}. Token has: ${provided.join(", ") || "(none)"}`,
    );
  }
}

export function ensureScope(
  client: ApiClient,
  scope: PublicApiScope,
): void {
  if (!client.scopes.includes(scope)) {
    throw new ScopeError(scope, client.scopes);
  }
}
