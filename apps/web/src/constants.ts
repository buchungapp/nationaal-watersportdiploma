import { constants } from "@nawadi/lib";

export const BASE_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? new URL(constants.WEBSITE_URL)
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? new URL(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`)
      : new URL(`http://localhost:${process.env.PORT ?? 3000}`);

export const SYSTEM_ADMIN_EMAILS = ["maurits@buchung.nl", "thomas@buchung.nl"];
