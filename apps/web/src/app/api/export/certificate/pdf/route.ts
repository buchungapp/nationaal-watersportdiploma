import { constants } from "@nawadi/lib";
import slugify from "@sindresorhus/slugify";
import type { NextRequest } from "next/server";
import { z } from "zod";
import dayjs from "~/lib/dayjs";
import { generatePDF } from "~/lib/generate-certificate-pdf";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams;

  const type = query.has("preview")
    ? ("preview" as const)
    : ("download" as const);

  const filename = `${dayjs().toISOString()}-export-diplomas-${slugify(constants.APP_NAME)}.pdf`;

  const certificateNumbers = query.getAll("certificate[]");

  const validatedNumbers = z
    .array(z.string().length(10))
    .safeParse(certificateNumbers);

  if (validatedNumbers.success === false) {
    return new Response(JSON.stringify(validatedNumbers.error), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const uniqueHandles = Array.from(new Set(validatedNumbers.data));

  if (uniqueHandles.length === 0) {
    return new Response("No certificate numbers provided", {
      status: 400,
    });
  }

  return presentPDF(filename, await generatePDF(uniqueHandles), type);
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
