import { z } from "zod";
import dayjs from "~/lib/dayjs";

export const certificateParamsSchema = z.object({
  handle: z.string(),
  issuedDate: z
    .string()
    .refine((datestr) => dayjs(datestr, "YYYYMMDD"))
    .transform((datestr) => dayjs(datestr, "YYYYMMDD")),
});

export function safeParseCertificateParams({
  handle,
  issuedDate,
}: {
  handle: unknown;
  issuedDate: unknown;
}) {
  const parsed = certificateParamsSchema.safeParse({
    handle,
    issuedDate,
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}
