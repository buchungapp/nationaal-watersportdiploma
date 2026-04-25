import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const betterAuthSchema = pgSchema("better_auth");

export const betterAuthUser = betterAuthSchema.table(
  "user",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    uniqueIndex("better_auth_user_email_idx").on(table.email),
  ],
);

export const betterAuthSession = betterAuthSchema.table(
  "session",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => betterAuthUser.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    uniqueIndex("better_auth_session_token_idx").on(table.token),
    index("better_auth_session_user_id_idx").on(table.userId),
  ],
);

export const betterAuthAccount = betterAuthSchema.table(
  "account",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => betterAuthUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    uniqueIndex("better_auth_account_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
    index("better_auth_account_user_id_idx").on(table.userId),
  ],
);

export const betterAuthVerification = betterAuthSchema.table(
  "verification",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    index("better_auth_verification_identifier_idx").on(table.identifier),
  ],
);

export const betterAuthRateLimit = betterAuthSchema.table(
  "rate_limit",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    key: text("key").notNull(),
    count: bigint("count", { mode: "number" }).notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    uniqueIndex("better_auth_rate_limit_key_idx").on(table.key),
  ],
);

export const betterAuthOauthClient = betterAuthSchema.table(
  "oauth_client",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    clientId: text("client_id").notNull().unique("better_auth_oauth_client_client_id_unq"),
    clientSecret: text("client_secret"),
    disabled: boolean("disabled").notNull().default(false),
    skipConsent: boolean("skip_consent"),
    enableEndSession: boolean("enable_end_session"),
    subjectType: text("subject_type"),
    scopes: text("scopes").array(),
    userId: uuid("user_id").references(() => betterAuthUser.id, {
      onDelete: "cascade",
    }),
    name: text("name"),
    uri: text("uri"),
    icon: text("icon"),
    contacts: text("contacts").array(),
    tos: text("tos"),
    policy: text("policy"),
    softwareId: text("software_id"),
    softwareVersion: text("software_version"),
    softwareStatement: text("software_statement"),
    redirectUris: text("redirect_uris").array().notNull(),
    postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
    tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
    grantTypes: text("grant_types").array(),
    responseTypes: text("response_types").array(),
    public: boolean("public"),
    type: text("type"),
    requirePKCE: boolean("require_pkce"),
    referenceId: text("reference_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    index("better_auth_oauth_client_user_id_idx").on(table.userId),
    index("better_auth_oauth_client_reference_id_idx").on(table.referenceId),
  ],
);

export const betterAuthOauthRefreshToken = betterAuthSchema.table(
  "oauth_refresh_token",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    token: text("token").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => betterAuthOauthClient.clientId, {
        onDelete: "cascade",
      }),
    sessionId: uuid("session_id").references(() => betterAuthSession.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => betterAuthUser.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    revoked: timestamp("revoked", {
      withTimezone: true,
      mode: "date",
    }),
    authTime: timestamp("auth_time", {
      withTimezone: true,
      mode: "date",
    }),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    uniqueIndex("better_auth_oauth_refresh_token_token_idx").on(table.token),
    index("better_auth_oauth_refresh_token_client_id_idx").on(table.clientId),
    index("better_auth_oauth_refresh_token_user_id_idx").on(table.userId),
  ],
);

export const betterAuthOauthAccessToken = betterAuthSchema.table(
  "oauth_access_token",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    token: text("token").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => betterAuthOauthClient.clientId, {
        onDelete: "cascade",
      }),
    sessionId: uuid("session_id").references(() => betterAuthSession.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => betterAuthUser.id, {
      onDelete: "cascade",
    }),
    referenceId: text("reference_id"),
    refreshId: uuid("refresh_id").references(
      () => betterAuthOauthRefreshToken.id,
      {
        onDelete: "cascade",
      },
    ),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    uniqueIndex("better_auth_oauth_access_token_token_idx").on(table.token),
    index("better_auth_oauth_access_token_client_id_idx").on(table.clientId),
    index("better_auth_oauth_access_token_user_id_idx").on(table.userId),
    index("better_auth_oauth_access_token_refresh_id_idx").on(table.refreshId),
  ],
);

export const betterAuthOauthConsent = betterAuthSchema.table(
  "oauth_consent",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => betterAuthOauthClient.clientId, {
        onDelete: "cascade",
      }),
    userId: uuid("user_id").references(() => betterAuthUser.id, {
      onDelete: "cascade",
    }),
    referenceId: text("reference_id"),
    scopes: text("scopes").array().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    index("better_auth_oauth_consent_client_id_idx").on(table.clientId),
    index("better_auth_oauth_consent_user_id_idx").on(table.userId),
  ],
);

export const betterAuthJwks = betterAuthSchema.table(
  "jwks",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    publicKey: text("public_key").notNull(),
    privateKey: text("private_key").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [primaryKey({ columns: [table.id] })],
);

export const betterAuthUserRelations = relations(
  betterAuthUser,
  ({ many }) => ({
    sessions: many(betterAuthSession),
    accounts: many(betterAuthAccount),
    oauthClients: many(betterAuthOauthClient),
    oauthRefreshTokens: many(betterAuthOauthRefreshToken),
    oauthAccessTokens: many(betterAuthOauthAccessToken),
    oauthConsents: many(betterAuthOauthConsent),
  }),
);

export const betterAuthSessionRelations = relations(
  betterAuthSession,
  ({ one }) => ({
    user: one(betterAuthUser, {
      fields: [betterAuthSession.userId],
      references: [betterAuthUser.id],
    }),
  }),
);

export const betterAuthAccountRelations = relations(
  betterAuthAccount,
  ({ one }) => ({
    user: one(betterAuthUser, {
      fields: [betterAuthAccount.userId],
      references: [betterAuthUser.id],
    }),
  }),
);

export const betterAuthOauthClientRelations = relations(
  betterAuthOauthClient,
  ({ one, many }) => ({
    user: one(betterAuthUser, {
      fields: [betterAuthOauthClient.userId],
      references: [betterAuthUser.id],
    }),
    refreshTokens: many(betterAuthOauthRefreshToken),
    accessTokens: many(betterAuthOauthAccessToken),
    consents: many(betterAuthOauthConsent),
  }),
);

export const betterAuthOauthRefreshTokenRelations = relations(
  betterAuthOauthRefreshToken,
  ({ one, many }) => ({
    client: one(betterAuthOauthClient, {
      fields: [betterAuthOauthRefreshToken.clientId],
      references: [betterAuthOauthClient.clientId],
    }),
    session: one(betterAuthSession, {
      fields: [betterAuthOauthRefreshToken.sessionId],
      references: [betterAuthSession.id],
    }),
    user: one(betterAuthUser, {
      fields: [betterAuthOauthRefreshToken.userId],
      references: [betterAuthUser.id],
    }),
    accessTokens: many(betterAuthOauthAccessToken),
  }),
);

export const betterAuthOauthAccessTokenRelations = relations(
  betterAuthOauthAccessToken,
  ({ one }) => ({
    client: one(betterAuthOauthClient, {
      fields: [betterAuthOauthAccessToken.clientId],
      references: [betterAuthOauthClient.clientId],
    }),
    session: one(betterAuthSession, {
      fields: [betterAuthOauthAccessToken.sessionId],
      references: [betterAuthSession.id],
    }),
    user: one(betterAuthUser, {
      fields: [betterAuthOauthAccessToken.userId],
      references: [betterAuthUser.id],
    }),
    refresh: one(betterAuthOauthRefreshToken, {
      fields: [betterAuthOauthAccessToken.refreshId],
      references: [betterAuthOauthRefreshToken.id],
    }),
  }),
);

export const betterAuthOauthConsentRelations = relations(
  betterAuthOauthConsent,
  ({ one }) => ({
    client: one(betterAuthOauthClient, {
      fields: [betterAuthOauthConsent.clientId],
      references: [betterAuthOauthClient.clientId],
    }),
    user: one(betterAuthUser, {
      fields: [betterAuthOauthConsent.userId],
      references: [betterAuthUser.id],
    }),
  }),
);
