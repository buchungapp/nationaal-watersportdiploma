import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  driver: 'pg',
  breakpoints: false,
} satisfies Config
