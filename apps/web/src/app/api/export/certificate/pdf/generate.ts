import { constants } from "@nawadi/lib";
import assert from "assert";
import dayjs from "dayjs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import SVGtoPDF from "svg-to-pdfkit";
import { generateAdvise } from "~/app/(diploma)/diploma/_utils/generate-advise";
import { listCertificatesByNumber } from "~/lib/nwd";

const fontPaths = {
  regular: "public/fonts/Inter-Regular.ttf",
  medium: "public/fonts/Inter-Medium.ttf",
  bold: "public/fonts/Inter-Bold.ttf",
  black: "public/fonts/Inter-Black.ttf",
};

// Caching setup
const cache = new Map<string, Promise<ArrayBuffer>>();

async function fetchLogoWithCache(
  url: string,
  options?: RequestInit,
): Promise<ArrayBuffer> {
  const cacheKey = `${url}_${JSON.stringify(options)}`;

  if (!cache.has(cacheKey)) {
    cache.set(
      cacheKey,
      fetch(url, options).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch logo");
        return res.arrayBuffer();
      }),
    );
  }

  return cache.get(cacheKey)!;
}

export async function generatePDF(
  certificateNumbers: string[],
  { debug = false } = {},
): Promise<ReadableStream> {
  const data = await listCertificatesByNumber(certificateNumbers);

  assert.strictEqual(
    data.length,
    certificateNumbers.length,
    "Some certificates were not found",
  );

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    font: path.join(process.cwd(), fontPaths.regular),
    info: {
      Author: constants.APP_NAME,
      CreationDate: new Date(),
      Title: "Export diploma's",
    },
  });

  Object.entries(fontPaths).forEach(([key, value]) =>
    doc.registerFont(key, path.join(process.cwd(), value)),
  );

  for await (const certificate of data) {
    const degree = certificate.program.degree.title;

    const uniqueCompletedModules = Array.from(
      new Set(
        certificate.completedCompetencies.map(
          (competency) => competency.curriculum_competency.moduleId,
        ),
      ),
    );

    const modules = certificate.curriculum.modules.filter((module) =>
      uniqueCompletedModules.includes(module.id),
    );

    const studentFullName = [
      certificate.student.firstName,
      certificate.student.lastNamePrefix,
      certificate.student.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const [advise, qrCodeSVG, locationCertificateLogo] = await Promise.all([
      generateAdvise(certificate),
      QRCode.toString(
        `https://www.nationaalwatersportdiploma.nl/diploma?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`,
        { errorCorrectionLevel: "low", type: "svg", margin: 0 },
      ),
      certificate.location.logoCertificate
        ? fetchLogoWithCache(certificate.location.logoCertificate.url)
        : null,
    ]);

    // Gear type
    doc.font("bold", 20).text(certificate.gearType.title ?? "", 476.22, 36.85, {
      ellipsis: true,
      lineBreak: false,
      width: 272.126 - 5.669,
      height: 17.921,
      align: "right",
      baseline: "hanging",
    });

    debug && doc.rect(476.22, 36.85, 272.126 - 5.669, 17.921).stroke();

    // Program title
    doc
      .font("regular", 11)
      .text(
        certificate.program.title?.slice(0, -1).trim() ?? "",
        476.22,
        56.378,
        {
          ellipsis: true,
          lineBreak: false,
          width: 272.126 - 5.669,
          height: 14.488,
          align: "right",
          baseline: "top",
        },
      );

    debug && doc.rect(476.22, 56.378, 272.126 - 5.669, 14.488).stroke();

    // Degree
    doc.font("black", 42).fillColor([255, 128, 0]);

    doc.text(degree ?? "", 748.346, 36.85, {
      lineBreak: false,
      width: 34.016,
      height: 34.016,
      align: "right",
      baseline: "hanging",
    });

    debug && doc.rect(748.346, 36.85, 34.016, 34.016).stroke();

    // Name
    doc.fillColor("black");

    doc.font("bold", 12).text(studentFullName, 476.22, 145.586, {
      width: 306.142,
      align: "left",
      baseline: "hanging",
    });

    // Date of birth
    doc
      .font("regular", 12)
      .text(
        certificate.student.dateOfBirth
          ? dayjs(certificate.student.dateOfBirth).format("DD-MM-YYYY")
          : "",
        476.22,
        201.561,
        {
          width: 148.819,
          align: "left",
          baseline: "hanging",
        },
      );

    // Place of birth
    doc.text(certificate.student.birthCity ?? "", 633.543, 201.561, {
      width: 148.819,
      align: "left",
      baseline: "hanging",
    });

    // Issued at
    doc.text(
      certificate.issuedAt
        ? dayjs(certificate.issuedAt).format("DD-MM-YYYY")
        : "",
      476.22,
      261.536,
      {
        width: 148.819,
        align: "left",
        baseline: "hanging",
      },
    );

    // Number
    doc.text(certificate.handle, 633.543, 261.536, {
      width: 148.819,
      align: "left",
      baseline: "hanging",
    });

    // Location
    if (locationCertificateLogo) {
      doc.image(locationCertificateLogo, 481.89, 331.18, {
        fit: [137.48, 87.874],
        align: "center",
        valign: "center",
      });
    } else {
      // Fallback location name
      doc
        .font("bold", 12)
        .text(certificate.location.name ?? "", 476.22, 331.18, {
          width: 148.819,
          align: "left",
          baseline: "hanging",
        });
    }

    // QR-code
    SVGtoPDF(doc, qrCodeSVG, 291.969, 501.732, {
      width: 62.362,
      height: 62.362,
      assumePt: true,
      preserveAspectRatio: "xMidYMid meet",
    });

    debug && doc.rect(291.969, 501.732, 62.362, 62.362).stroke();

    // Advice
    const options = {
      width: 201.26,
      height: 62.362,
      align: "justify",
    } as const;

    doc
      .font("regular", 10)
      .text(
        advise,
        65.197,
        501.732 + 0.5 * (62.362 - doc.heightOfString(advise, options)),
        options,
      );

    debug && doc.rect(65.197, 501.732, 201.26, 62.362).stroke();

    // Modules
    let x = 56.693;
    let y = 173.649;
    const width = 148.819;
    const height = 24.205;
    const gapX = 8.504;
    const gapY = 8.504 * 1.5;

    doc.font("medium", 10);
    doc.strokeColor([0, 71, 171]);

    modules.forEach((module, index) => {
      const options = {
        width,
        align: "left",
      } as const;

      const textHeight = doc.heightOfString(module.title ?? "", options);

      doc.text(
        module.title ?? "",
        x,
        y + Math.max(height - textHeight, 0),
        options,
      );

      doc
        .moveTo(x, y + height + 1.928)
        .lineWidth(1)
        .lineTo(x + width, y + height + 1.928)
        .stroke();

      doc
        .moveTo(x, y + height + 1.928 + 3)
        .lineWidth(1)
        .lineTo(x + width, y + height + 1.928 + 3)
        .stroke();

      if ((index + 1) % 2 === 0) {
        x = x - gapX - width;
        y = y + gapY + height;
      } else {
        x = x + gapX + width;
        y = y;
      }
    });

    // Add page if needed
    if (data.indexOf(certificate) < data.length - 1) {
      doc.addPage();
    }
  }

  doc.end();

  return new ReadableStream({
    start(controller) {
      doc.on("data", (chunk) => controller.enqueue(chunk));
      doc.on("end", () => controller.close());
    },
  });
}
