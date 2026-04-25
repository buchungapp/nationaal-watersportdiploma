import { oauthProvider } from "@better-auth/oauth-provider";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins/bearer";
import { emailOTP } from "better-auth/plugins/email-otp";

import { schema as s } from "@nawadi/db";

import { useDatabase } from "../contexts/database.js";
import {
  AUTH_OTP_EXPIRES_IN_SECONDS,
  getAuthBaseUrl,
  getAuthSecret,
  resolveTrustedAuthOrigins,
  sendAuthOtpEmail,
} from "./email.js";

const AUTH_SESSION_EXPIRES_IN = 30 * 24 * 60 * 60;
const GENERIC_AUTH_RATE_LIMIT_WINDOW = 60;
const GENERIC_AUTH_RATE_LIMIT_MAX = 100;
const OTP_RATE_LIMIT_WINDOW = 60;
const OTP_RATE_LIMIT_MAX = 3;

export const VAARSCHOOL_CLAIM = "https://api.nwd.nl/vaarschool";
export const VENDOR_CLAIM = "https://api.nwd.nl/vendor";
export const PUBLIC_API_AUDIENCE = "https://api.nwd.nl";
const M2M_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

export const PUBLIC_API_SCOPES = [
  "cohorts:read",
  "cohorts:write",
  "persons:lookup",
  "certificates:read",
] as const;

export type PublicApiScope = (typeof PUBLIC_API_SCOPES)[number];

const betterAuthSchema = {
  user: s.betterAuthUser,
  session: s.betterAuthSession,
  account: s.betterAuthAccount,
  verification: s.betterAuthVerification,
  rateLimit: s.betterAuthRateLimit,
  oauthClient: s.betterAuthOauthClient,
  oauthRefreshToken: s.betterAuthOauthRefreshToken,
  oauthAccessToken: s.betterAuthOauthAccessToken,
  oauthConsent: s.betterAuthOauthConsent,
  jwks: s.betterAuthJwks,
  userRelations: s.betterAuthUserRelations,
  sessionRelations: s.betterAuthSessionRelations,
  accountRelations: s.betterAuthAccountRelations,
  oauthClientRelations: s.betterAuthOauthClientRelations,
  oauthRefreshTokenRelations: s.betterAuthOauthRefreshTokenRelations,
  oauthAccessTokenRelations: s.betterAuthOauthAccessTokenRelations,
  oauthConsentRelations: s.betterAuthOauthConsentRelations,
};

export function createBetterAuthOptions(args?: {
  query?: ReturnType<typeof useDatabase>;
}) {
  return {
    database: drizzleAdapter(args?.query ?? useDatabase(), {
      provider: "pg",
      schema: betterAuthSchema,
    }),
    baseURL: getAuthBaseUrl(),
    secret: getAuthSecret(),
    trustedOrigins: resolveTrustedAuthOrigins(),
    emailAndPassword: {
      enabled: false,
    },
    rateLimit: {
      enabled: true,
      window: GENERIC_AUTH_RATE_LIMIT_WINDOW,
      max: GENERIC_AUTH_RATE_LIMIT_MAX,
      storage: "database",
    },
    session: {
      expiresIn: AUTH_SESSION_EXPIRES_IN,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      database: {
        generateId: "uuid" as const,
      },
    },
    plugins: [
      bearer(),
      emailOTP({
        disableSignUp: false,
        otpLength: 6,
        expiresIn: AUTH_OTP_EXPIRES_IN_SECONDS,
        allowedAttempts: 3,
        storeOTP: "hashed",
        rateLimit: {
          window: OTP_RATE_LIMIT_WINDOW,
          max: OTP_RATE_LIMIT_MAX,
        },
        sendVerificationOTP: async (args: {
          email: string;
          otp: string;
          type: string;
        }) => {
          await sendAuthOtpEmail({ email: args.email, otp: args.otp });
        },
      }),
      oauthProvider({
        scopes: [...PUBLIC_API_SCOPES],
        grantTypes: ["client_credentials"],
        validAudiences: [PUBLIC_API_AUDIENCE],
        m2mAccessTokenExpiresIn: M2M_ACCESS_TOKEN_TTL_SECONDS,
        loginPage: "/api/auth/oauth-not-supported",
        consentPage: "/api/auth/oauth-not-supported",
        clientPrivileges: () => false,
        customAccessTokenClaims: ({ referenceId, metadata }) => {
          const claims: Record<string, unknown> = {};
          if (referenceId) {
            claims[VAARSCHOOL_CLAIM] = referenceId;
          }
          if (metadata && typeof metadata === "object") {
            const vendor = (metadata as Record<string, unknown>).vendor;
            if (typeof vendor === "string") {
              claims[VENDOR_CLAIM] = vendor;
            }
          }
          return claims;
        },
      }),
    ],
  } satisfies BetterAuthOptions;
}

function createBetterAuthWithDatabase(query: ReturnType<typeof useDatabase>) {
  return betterAuth(createBetterAuthOptions({ query }));
}

const betterAuthByDatabase = new WeakMap<
  ReturnType<typeof useDatabase>,
  ReturnType<typeof createBetterAuthWithDatabase>
>();

export function getBetterAuth() {
  const database = useDatabase();
  const existing = betterAuthByDatabase.get(database);

  if (existing) {
    return existing;
  }

  const instance = createBetterAuthWithDatabase(database);
  betterAuthByDatabase.set(database, instance);
  return instance;
}

export type BetterAuthInstance = ReturnType<typeof getBetterAuth>;
export type Session = BetterAuthInstance["$Infer"]["Session"];
