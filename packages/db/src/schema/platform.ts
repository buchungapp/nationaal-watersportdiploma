import { sql } from "drizzle-orm";
import {
  char,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { user } from "./user.js";

export const country = pgTable(
  "country",
  {
    id: integer("id").primaryKey().notNull(),
    ar: text("ar").default("").notNull(),
    bg: text("bg").default("").notNull(),
    cs: text("cs").default("").notNull(),
    da: text("da").default("").notNull(),
    de: text("de").default("").notNull(),
    el: text("el").default("").notNull(),
    en: text("en").default("").notNull(),
    es: text("es").default("").notNull(),
    et: text("et").default("").notNull(),
    eu: text("eu").default("").notNull(),
    fi: text("fi").default("").notNull(),
    fr: text("fr").default("").notNull(),
    hu: text("hu").default("").notNull(),
    it: text("it").default("").notNull(),
    ja: text("ja").default("").notNull(),
    ko: text("ko").default("").notNull(),
    lt: text("lt").default("").notNull(),
    nl: text("nl").default("").notNull(),
    no: text("no").default("").notNull(),
    pl: text("pl").default("").notNull(),
    pt: text("pt").default("").notNull(),
    ro: text("ro").default("").notNull(),
    ru: text("ru").default("").notNull(),
    sk: text("sk").default("").notNull(),
    sv: text("sv").default("").notNull(),
    th: text("th").default("").notNull(),
    uk: text("uk").default("").notNull(),
    zh: text("zh").default("").notNull(),
    "zh-tw": text("zh-tw").default("").notNull(),
    alpha_2: char("alpha_2", { length: 2 }).default("").notNull(),
    alpha_3: char("alpha_3", { length: 3 }).default("").notNull(),
  },
  (table) => {
    return {
      alpha_2_is_unique: uniqueIndex("country_alpha_2_is_unique").on(
        table.alpha_2,
      ),
      alpha_3_is_unique: uniqueIndex("country_alpha_3_is_unique").on(
        table.alpha_3,
      ),
    };
  },
);

export const feedbackType = pgEnum("feedback_type", [
  "bug",
  "product-feedback",
  "program-feedback",
  "question",
  "other",
]);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    type: feedbackType("type").notNull(),
    message: text("message"),
    path: text("path"),
    query: jsonb("query").default(sql`'{}'::jsonb`),
    headers: jsonb("headers").default(sql`'{}'::jsonb`),
    base: jsonb("base").default(sql`'{}'::jsonb`),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    priority: integer("priority").default(1).notNull(),
    insertedBy: uuid("inserted_by"),
    ...timestamps,
    resolvedAt: timestamp("resolved_at", {
      mode: "string",
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      insertedByReference: foreignKey({
        columns: [table.insertedBy],
        foreignColumns: [user.authUserId],
        name: "feedback_inserted_by_fk",
      }),
    };
  },
);
