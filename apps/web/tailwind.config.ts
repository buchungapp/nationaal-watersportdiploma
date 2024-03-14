import type { Config } from "tailwindcss";
import { slate } from "tailwindcss/colors";
import typographyStyles from "./typography";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: slate,
        branding: {
          orange: "#ff8000",
          light: "#007FFF",
          dark: "#0047ab",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      transitionProperty: {
        width: "width",
      },
    },
    typography: typographyStyles,
  },
  plugins: [require("@tailwindcss/typography"), require("@headlessui/tailwindcss")],
} satisfies Config;
