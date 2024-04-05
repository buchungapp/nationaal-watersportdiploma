import { char, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

export const country = pgTable(
  'country',
  {
    id: integer('id').primaryKey().notNull(),
    ar: text('ar').default('').notNull(),
    bg: text('bg').default('').notNull(),
    cs: text('cs').default('').notNull(),
    da: text('da').default('').notNull(),
    de: text('de').default('').notNull(),
    el: text('el').default('').notNull(),
    en: text('en').default('').notNull(),
    es: text('es').default('').notNull(),
    et: text('et').default('').notNull(),
    eu: text('eu').default('').notNull(),
    fi: text('fi').default('').notNull(),
    fr: text('fr').default('').notNull(),
    hu: text('hu').default('').notNull(),
    it: text('it').default('').notNull(),
    ja: text('ja').default('').notNull(),
    ko: text('ko').default('').notNull(),
    lt: text('lt').default('').notNull(),
    nl: text('nl').default('').notNull(),
    no: text('no').default('').notNull(),
    pl: text('pl').default('').notNull(),
    pt: text('pt').default('').notNull(),
    ro: text('ro').default('').notNull(),
    ru: text('ru').default('').notNull(),
    sk: text('sk').default('').notNull(),
    sv: text('sv').default('').notNull(),
    th: text('th').default('').notNull(),
    uk: text('uk').default('').notNull(),
    zh: text('zh').default('').notNull(),
    ['zh-tw']: text('zh-tw').default('').notNull(),
    alpha_2: char('alpha_2', { length: 2 }).default('').notNull(),
    alpha_3: char('alpha_3', { length: 3 }).default('').notNull(),
  },
  (table) => {
    return {
      alpha_2_is_unique: uniqueIndex('country_alpha_2_is_unique').on(
        table.alpha_2,
      ),
      alpha_3_is_unique: uniqueIndex('country_alpha_3_is_unique').on(
        table.alpha_3,
      ),
    }
  },
)
