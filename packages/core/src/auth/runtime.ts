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

const betterAuthSchema = {
  user: s.betterAuthUser,
  session: s.betterAuthSession,
  account: s.betterAuthAccount,
  verification: s.betterAuthVerification,
  rateLimit: s.betterAuthRateLimit,
  userRelations: s.betterAuthUserRelations,
  sessionRelations: s.betterAuthSessionRelations,
  accountRelations: s.betterAuthAccountRelations,
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
