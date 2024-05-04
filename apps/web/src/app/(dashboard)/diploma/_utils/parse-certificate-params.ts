import dayjs from "dayjs";
import { z } from "zod";

import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

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
