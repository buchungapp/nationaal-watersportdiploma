import type { Config } from 'drizzle-kit'

export default {
  schema: './out/schema/index.js',
  out: './migrations',
  driver: 'pg',
  breakpoints: false,
} satisfies Config
