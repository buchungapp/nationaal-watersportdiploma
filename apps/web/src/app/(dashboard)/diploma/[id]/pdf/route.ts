import type { NextRequest } from "next/server";
import puppeteer from "puppeteer";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const query = new URL(request.url).searchParams;

  const type = query.has("preview")
    ? ("preview" as const)
    : ("download" as const);
}

function presentPDF(
  filename: string,
  data: Buffer,
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

async function generatePDF(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url);

  // Give the page time to load
  await page.waitForSelector('[data-pdf-state="ready"]', {
    timeout: 2 * 60 * 1000, // 2 minutes
  });

  const pdfBuffer = await page.pdf({
    printBackground: false,
    landscape: true,
    format: "A4",
    preferCSSPageSize: true,
  });

  await browser.close();

  return pdfBuffer;
}
