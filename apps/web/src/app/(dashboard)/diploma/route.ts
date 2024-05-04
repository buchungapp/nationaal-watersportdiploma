import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { findCertificate } from "~/lib/nwd";
import { safeParseCertificateParams } from "./_utils/parse-certificate-params";

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;

  const result = safeParseCertificateParams({
    handle: searchParams.get("nummer"),
    issuedDate: searchParams.get("datum"),
  });

  if (!result) {
    notFound();
  }

  const certificate = await findCertificate({
    handle: result.handle,
    issuedAt: result.issuedDate.toISOString(),
  }).catch(() => notFound());

  // We assume that visitors came from a QR code, so we redirect them to the
  // certificate page and add a query parameter to show some confetti.
  redirect(
    `/diploma/${certificate.id}/?redirected=true&nummer=${result.handle}&datum=${result.issuedDate.format("YYYYMMDD")}`,
  );
}
