import type { Config } from "tailwindcss";
import typographyStyles from "./typography.ts";

export default {
  theme: {
    typography: typographyStyles,
  },
} satisfies Config;
