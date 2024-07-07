import type { Config } from 'drizzle-kit'

export default {
  schema: './out/schema/index.js',
  out: './migrations',
  dialect: 'postgresql',
  breakpoints: false,
} satisfies Config
