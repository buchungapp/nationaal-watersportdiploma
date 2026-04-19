// Extract text from every PDF in .tmp/portfolio-corpus/raw/.
// Outputs one JSON per PDF to .tmp/portfolio-corpus/extracted/.
//
// Run from repo root:
//   node --experimental-strip-types apps/web/scripts/corpus/extract.ts
// Or:  pnpm -C apps/web corpus:extract

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  EXTRACTED_DIR,
  type ExtractedPortfolio,
  listRawPdfs,
  parseFilename,
  RAW_DIR,
} from "./shared.ts";

mkdirSync(EXTRACTED_DIR, { recursive: true });

async function extractOne(file: string): Promise<ExtractedPortfolio> {
  const data = new Uint8Array(readFileSync(join(RAW_DIR, file)));
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }
  const rawText = parts.join("\n\n--- PAGE BREAK ---\n\n");
  return {
    sourceFile: file,
    parsed: parseFilename(file),
    pageCount: doc.numPages,
    rawText,
    charCount: rawText.length,
    extractedAt: new Date().toISOString(),
  };
}

const files = listRawPdfs();
console.log(`Extracting ${files.length} PDFs from ${RAW_DIR}`);

let totalChars = 0;
let totalPages = 0;
const failures: Array<{ file: string; reason: string }> = [];

for (const file of files) {
  try {
    const result = await extractOne(file);
    const outPath = join(EXTRACTED_DIR, `${file.replace(/\.pdf$/i, "")}.json`);
    writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
    totalChars += result.charCount;
    totalPages += result.pageCount;
    console.log(
      `  ✓ ${file}  ${result.pageCount}p  ${result.charCount}ch  ${result.parsed.isFullNiveau ? `full N${result.parsed.inferredNiveau}` : `kerntaken ${result.parsed.kerntaakCodes.join(",")}`}`,
    );
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    failures.push({ file, reason });
    console.error(`  ✗ ${file}  ${reason}`);
  }
}

console.log(
  `\nExtracted ${files.length - failures.length}/${files.length} portfolios. ${totalPages} pages, ${totalChars} characters.`,
);
if (failures.length > 0) {
  console.error(`Failures:`);
  for (const f of failures) console.error(`  - ${f.file}: ${f.reason}`);
  process.exit(1);
}
