import { constants } from "@nawadi/lib";
import slugify from "@sindresorhus/slugify";
import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeParseCertificateParams } from "~/app/(certificate)/diploma/_utils/parse-certificate-params";
import dayjs from "~/lib/dayjs";
import { generatePDF } from "~/lib/generate-certificate-pdf";
import { findCertificate, retrieveCertificateById } from "~/lib/nwd";
import { presentPDF } from "../_utils/present-pdf";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const searchParams = new URL(request.url).searchParams;

  const result = safeParseCertificateParams({
    handle: searchParams.get("handle"),
    issuedDate: searchParams.get("issuedDate"),
  });

  if (!result) {
    notFound();
  }

  const [certificateFromParams, certificateFromId] = await Promise.all([
    findCertificate({
      handle: result.handle,
      issuedAt: result.issuedDate.toISOString(),
    }).catch(() => notFound()),
    context.params.then((params) =>
      retrieveCertificateById(params.id).catch(() => notFound()),
    ),
  ]);

  if (certificateFromParams.id !== certificateFromId.id) {
    notFound();
  }

  const type = searchParams.has("preview")
    ? ("preview" as const)
    : ("download" as const);

  const filename = `${
    searchParams.has("filename")
      ? searchParams.get("filename")
      : `${dayjs().toISOString()}-export-diplomas-${slugify(constants.APP_NAME)}`
  }.pdf`;

  return presentPDF(
    filename,
    await generatePDF([certificateFromParams.handle], {
      style: searchParams.has("print") ? "print" : "digital",
      debug: searchParams.has("debug"),
    }),
    type,
  );
}
