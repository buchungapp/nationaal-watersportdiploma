import assert from "node:assert";
import path from "node:path";
import { constants } from "@nawadi/lib";
import { pdfkitAddPlaceholder } from "@signpdf/placeholder-pdfkit";
import { P12Signer } from "@signpdf/signer-p12";
import signpdf from "@signpdf/signpdf";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import SVGtoPDF from "svg-to-pdfkit";
import { generateAdvise } from "~/app/(certificate)/diploma/_utils/generate-advise";
import dayjs from "~/lib/dayjs";
import { listCertificatesByNumber } from "~/lib/nwd";

function getPath(filename: string) {
  return path.join(process.cwd(), filename);
}

const fontPaths = {
  regular: "./src/assets/fonts/Inter-Regular.ttf",
  medium: "./src/assets/fonts/Inter-Medium.ttf",
  bold: "./src/assets/fonts/Inter-Bold.ttf",
  black: "./src/assets/fonts/Inter-Black.ttf",
};

const backgroundPaths = {
  bahiaOutside: "./src/assets/certificates/bahia_01.png",
  bahiaInside: "./src/assets/certificates/bahia_02.png",
  templateOutsideBack: "./src/assets/certificates/diploma-template_01-back.png",
  templateOutsideFront:
    "./src/assets/certificates/diploma-template_01-front.png",
  templateInside: "./src/assets/certificates/diploma-template_02.png",
};

// Caching setup
const cache = new Map<string, Promise<ArrayBuffer>>();

// Simple 1x1 transparent PNG as placeholder (89 bytes)
const PLACEHOLDER_LOGO = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
  0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
  0x60, 0x82,
]).buffer;

async function fetchLogoWithCache(
  url: string,
  options?: RequestInit,
): Promise<ArrayBuffer> {
  const cacheKey = `${url}_${JSON.stringify(options)}`;

  if (!cache.has(cacheKey)) {
    cache.set(
      cacheKey,
      fetch(url, options).then((res) => {
        if (!res.ok) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `Failed to fetch logo from ${url}, using placeholder in development mode`,
            );
            return PLACEHOLDER_LOGO;
          }
          throw new Error("Failed to fetch logo");
        }
        return res.arrayBuffer();
      }),
    );
  }

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  return cache.get(cacheKey)!;
}

export async function generatePDF(
  certificateNumbers: string[],
  {
    debug = false,
    sort = "student",
    style = "print",
    digitalSignature,
  }: {
    debug?: boolean;
    sort?: "student" | "instructor";
    style?: "print" | "digital";
    digitalSignature?: {
      certificate: ArrayBuffer;
      passphrase: string;
      reason: string;
      location: string;
      contactInfo: string;
      name: string;
    };
  } = {},
): Promise<ReadableStream> {
  const data = await listCertificatesByNumber(certificateNumbers, sort);

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

  for (const [key, value] of Object.entries(fontPaths)) {
    doc.registerFont(key, getPath(value));
  }

  for await (const certificate of data) {
    if (style === "digital") {
      doc.image(getPath(backgroundPaths.templateOutsideBack), 0, 0, {
        cover: [doc.page.width, doc.page.height],
        align: "center",
        valign: "center",
      });

      doc.image(getPath(backgroundPaths.bahiaOutside), 0, 0, {
        fit: [doc.page.width, doc.page.height],
        align: "center",
        valign: "center",
      });

      doc.image(getPath(backgroundPaths.templateOutsideFront), 0, 0, {
        cover: [doc.page.width, doc.page.height],
        align: "center",
        valign: "center",
      });

      doc.addPage();
    }

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

    // Background
    if (style === "digital") {
      // Boat
      doc.image(getPath(backgroundPaths.bahiaInside), 0, 0, {
        fit: [doc.page.width, doc.page.height],
        align: "center",
        valign: "center",
      });

      // Template
      doc.image(getPath(backgroundPaths.templateInside), 0, 0, {
        cover: [doc.page.width, doc.page.height],
        align: "center",
        valign: "center",
      });
    }

    // Gear type
    doc
      .font("bold", 20)
      .text(certificate.gearType.title ?? "", 479.055, 39.685, {
        ellipsis: true,
        lineBreak: false,
        width: 272.126 - 5.669,
        height: 17.921,
        align: "right",
        baseline: "hanging",
      });

    debug && doc.rect(479.055, 39.685, 272.126 - 5.669, 17.921).stroke();

    // Program title
    doc
      .font("regular", 11)
      .text(
        certificate.program.title ?? certificate.program.course.title ?? "",
        479.055,
        59.213,
        {
          ellipsis: true,
          lineBreak: false,
          width: 272.126 - 5.669,
          height: 14.488,
          align: "right",
          baseline: "top",
        },
      );

    debug && doc.rect(479.055, 59.213, 272.126 - 5.669, 14.488).stroke();

    // Degree
    doc.font("black", 42).fillColor([255, 128, 0]);

    doc.text(degree ?? "", 751.181, 39.685, {
      lineBreak: false,
      width: 34.016,
      height: 34.016,
      align: "right",
      baseline: "hanging",
    });

    debug && doc.rect(751.181, 39.685, 34.016, 34.016).stroke();

    // Name
    doc.fillColor("black");

    doc.font("bold", 12).text(studentFullName, 479.055, 144.421 + 4, {
      width: 306.142,
      align: "left",
      baseline: "hanging",
    });

    debug && doc.rect(479.055, 144.421 + 4, 306.142, 12).stroke();

    // Date of birth
    doc
      .font("regular", 12)
      .text(
        certificate.student.dateOfBirth
          ? dayjs(certificate.student.dateOfBirth).format("DD-MM-YYYY")
          : "",
        479.055,
        204.395 + 4,
        {
          width: 148.819,
          align: "left",
          baseline: "hanging",
        },
      );

    debug && doc.rect(479.055, 204.395 + 4, 148.819, 12).stroke();

    // Place of birth
    doc.text(certificate.student.birthCity ?? "", 636.378, 204.395 + 4, {
      width: 148.819,
      align: "left",
      baseline: "hanging",
    });

    debug && doc.rect(636.378, 204.395 + 4, 148.819, 12).stroke();

    // Issued at
    doc.text(
      certificate.issuedAt
        ? dayjs(certificate.issuedAt).format("DD-MM-YYYY")
        : "",
      479.055,
      264.37 + 4,
      {
        width: 148.819,
        align: "left",
        baseline: "hanging",
      },
    );

    debug && doc.rect(479.055, 264.37 + 4, 148.819, 12).stroke();

    // Number
    doc.text(certificate.handle, 636.378, 264.37 + 4, {
      width: 148.819,
      align: "left",
      baseline: "hanging",
    });

    debug && doc.rect(636.378, 264.37 + 4, 148.819, 12).stroke();

    // Location
    if (locationCertificateLogo) {
      doc.image(locationCertificateLogo, 487.559, 334.014, {
        fit: [131.811, 82.205],
        align: "center",
        valign: "center",
      });
    } else {
      // Fallback location name
      const textOptions = {
        width: 131.811,
        align: "center",
      } as const;

      const textHeight = doc.heightOfString(
        certificate.location.name ?? "",
        textOptions,
      );
      const yPosition = 334.014 + (82.205 - textHeight) / 2;

      doc
        .font("bold", 12)
        .text(certificate.location.name ?? "", 487.559, yPosition, {
          width: 131.811,
          align: "center",
          baseline: "top",
        });
    }

    debug && doc.rect(487.559, 334.014, 131.811, 82.205).stroke();

    // QR-code
    SVGtoPDF(doc, qrCodeSVG, 291.969, 501.927, {
      width: 62.362,
      height: 62.362,
      assumePt: true,
      preserveAspectRatio: "xMidYMid meet",
    });

    debug && doc.rect(291.969, 501.927, 62.362, 62.362).stroke();

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
      }
    });

    // Add page if needed
    if (data.indexOf(certificate) < data.length - 1) {
      doc.addPage();
    }
  }

  // Handle digital signature if provided
  if (digitalSignature) {
    // Add signature placeholder before ending the document
    const signatureOptions = {
      reason: digitalSignature.reason,
      contactInfo: digitalSignature.contactInfo,
      name: digitalSignature.name,
      location: digitalSignature.location,
    };

    pdfkitAddPlaceholder({
      pdf: doc,
      pdfBuffer: Buffer.alloc(0), // Will be properly set when PDF is generated
      ...signatureOptions,
    });
  }

  // Generate the PDF buffer first
  return new Promise<ReadableStream>((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", async () => {
      try {
        let pdfBuffer = Buffer.concat(chunks);

        // Sign the PDF if digital signature is provided
        if (digitalSignature) {
          const signer = new P12Signer(
            Buffer.from(digitalSignature.certificate),
            {
              passphrase: digitalSignature.passphrase,
            },
          );

          pdfBuffer = Buffer.from(await signpdf.sign(pdfBuffer, signer));
        }

        // Create a ReadableStream from the final buffer
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(pdfBuffer);
            controller.close();
          },
        });

        resolve(stream);
      } catch (error) {
        reject(error);
      }
    });

    doc.on("error", (error) => {
      reject(error);
    });

    // End the document to trigger the generation
    doc.end();
  });
}
