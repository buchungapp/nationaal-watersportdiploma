import { constants } from "@nawadi/lib";
import slugify from "@sindresorhus/slugify";
import type { NextRequest } from "next/server";
import dayjs from "~/lib/dayjs";
import { generatePDF } from "~/lib/generate-certificate-pdf";
import { retrieveCertificateHandles } from "~/lib/nwd";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.has("preview")
    ? ("preview" as const)
    : ("download" as const);

  const { handles, settings } = await retrieveCertificateHandles(
    (await context.params).id,
  );

  return presentPDF(
    `${
      settings.fileName ??
      `${dayjs().toISOString()}-export-diplomas-${slugify(constants.APP_NAME)}`
    }.pdf`,
    await generatePDF(handles, { sort: settings.sort }),
    type,
  );
}

function presentPDF(
  filename: string,
  data: ReadableStream,
  type: "download" | "preview",
) {
  const types = {
    download: "attachment",
    preview: "inline",
  };

  return new Response(data, {
    status: 201,
    headers: {
      "Content-Disposition": `${types[type]}; filename="${filename}"`,
      "Content-Type": "application/pdf",
    },
  });
}
