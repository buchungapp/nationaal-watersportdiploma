import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { notFound } from "next/navigation";
import { z } from "zod";
import CertificateTemplate from "./_components/template";

dayjs.extend(customParseFormat);

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
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
      handle: searchParams.nummer,
      issuedDate: searchParams.datum,
    });

  if (!parsed.success) {
    notFound();
  }

  return (
    <CertificateTemplate
      issuedAt={parsed.data.issuedDate}
      handle={parsed.data.handle}
    />
  );
}
