import { constants } from "@nawadi/lib";
import dayjs from "dayjs";
import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";
import { retrieveCertificateById } from "~/lib/nwd";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const query = new URL(request.url).searchParams;

  const certificate = await retrieveCertificateById(params.id).catch(() =>
    notFound(),
  );

  const type = query.has("preview")
    ? ("preview" as const)
    : ("download" as const);

  const filename = `${dayjs().toISOString()}-${certificate.handle}-${dayjs(certificate.issuedAt).format("DD-MM-YYYY")}.pdf`;

  return presentPDF(
    filename,
    await generatePDF(filename, request.url.replace("/pdf", "/raw")),
    type,
  );
}

function presentPDF(
  filename: string,
  data: Uint8Array,
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
      "Content-Length": Buffer.byteLength(data).toString(),
    },
  });
}

async function generatePDF(filename: string, url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url);

  const pdfBuffer = await page.pdf({
    printBackground: false,
    landscape: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdfDoc.setTitle(filename);
  pdfDoc.setAuthor(constants.APP_NAME);

  return pdfDoc.save();
}
