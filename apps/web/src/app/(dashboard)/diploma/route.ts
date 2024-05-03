import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { findCertificate } from "~/lib/nwd";

dayjs.extend(customParseFormat);

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;

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
      handle: searchParams.get("nummer"),
      issuedDate: searchParams.get("datum"),
    });

  if (!parsed.success) {
    notFound();
  }

  const certificate = await findCertificate({
    handle: parsed.data.handle,
    issuedAt: parsed.data.issuedDate.toISOString(),
  }).catch(() => notFound());

  // We assume that visitors came from a QR code, so we redirect them to the
  // certificate page and add a query parameter to show some confetti.
  redirect(`/diploma/${certificate.id}/?redirected=true`);
}
