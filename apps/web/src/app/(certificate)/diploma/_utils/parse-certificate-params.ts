import { z } from "zod";
import dayjs from "~/lib/dayjs";

export function safeParseCertificateParams({
  handle,
  issuedDate,
}: {
  handle: unknown;
  issuedDate: unknown;
}) {
  const parsed = z
    .object({
      handle: z.string(),
      // String in YYYYMMDD format
      issuedDate: z
        .string()
        .refine((datestr) => dayjs(datestr, "YYYYMMDD"))
        .transform((datestr) => dayjs(datestr, "YYYYMMDD")),
    })
    .safeParse({
      handle,
      issuedDate,
    });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}
