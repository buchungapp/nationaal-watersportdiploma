import type { Config } from "tailwindcss";
import typographyStyles from "./typography";

export default {
  theme: {
    typography: typographyStyles,
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@headlessui/tailwindcss"),
  ],
} satisfies Config;
