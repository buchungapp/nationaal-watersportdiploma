import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    `${url.origin}${url.pathname}/template?${url.searchParams.toString()}`,
  );

  const pdfBuffer = await page.pdf({
    format: "A4",
    landscape: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  const response = new NextResponse(pdfBuffer);
  response.headers.set("content-type", "application/pdf");
  return response;
}
