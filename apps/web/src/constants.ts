import { WEBSITE_URL } from "@nawadi/lib/constants";

export const BASE_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? new URL(WEBSITE_URL)
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? new URL(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`)
      : new URL(`http://localhost:${process.env.PORT ?? 3000}`);
