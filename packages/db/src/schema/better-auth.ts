import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
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

export const betterAuthUserRelations = relations(
  betterAuthUser,
  ({ many }) => ({
    sessions: many(betterAuthSession),
    accounts: many(betterAuthAccount),
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
