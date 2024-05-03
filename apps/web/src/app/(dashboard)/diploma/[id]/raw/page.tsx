import clsx from "clsx";
import dayjs from "dayjs";
import { QRCodeSVG } from "qrcode.react";
import type { PropsWithChildren } from "react";
import { retrieveCertificateById } from "~/lib/nwd";
import bg from "./diploma-print-bg.png";
import "./printStyles.css";

const DataField = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <span
    className={clsx(
      "absolute w-[52.5mm] h-[5.512mm] pt-[1.411mm] font-base text-[12pt]",
      className,
    )}
  >
    {children}
  </span>
);

const Module = ({ value }: { value: string }) => (
  <span className="flex flex-col w-[52.5mm]">
    <span className="text-[9pt] font-medium leading-[10pt]">{value}</span>

    <svg
      width="100%"
      height="1pt"
      className="text-branding-light h-[1pt] w-full mt-[0.723mm]"
    >
      <rect width="100%" height="100%" fill="currentColor" />
    </svg>

    <svg
      width="100%"
      height="1pt"
      className="text-branding-light h-[1pt] w-full mt-[2pt]"
    >
      <rect width="100%" height="100%" fill="currentColor" />
    </svg>
  </span>
);

export default async function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const certificate = await retrieveCertificateById(params.id);

  const uniqueCompletedModules = Array.from(
    new Set(
      certificate.completedCompetencies.map(
        (competency) => competency.curriculum_competency.moduleId,
      ),
    ),
  );

  const allUniqueModules = Array.from(
    new Set(certificate.curriculum.modules.map((module) => module.id)),
  );

  const modules = certificate.curriculum.modules.filter((module) =>
    uniqueCompletedModules.includes(module.id),
  );

  const hasMoreModules =
    uniqueCompletedModules.length < allUniqueModules.length;

  const nextRang = certificate.program.degree.rang + 1;

  const adviceStrings = [];

  if (hasMoreModules) {
    adviceStrings.push(
      "verbreed jezelf binnen je huidige niveau door extra modules te volgen",
    );
  }

  if (nextRang <= 4) {
    adviceStrings.push(
      `ga de uitdaging aan met het volgende niveau ${nextRang}`,
    );
  }

  adviceStrings.push("duik in een nieuwe discipline");

  // Function to format and combine advice strings
  const formatAdvice = (advice: string[]) => {
    if (advice.length === 0) {
      return ""; // No advice to give
    }

    // Capitalize the first letter of the first advice
    advice[0] = advice[0]!.charAt(0).toUpperCase() + advice[0]!.slice(1);

    if (advice.length > 1) {
      const lastAdvice = advice.pop();
      return `${advice.join(", ")} of ${lastAdvice}!`;
    } else {
      return `${advice[0]}.`;
    }
  };

  const combinedAdvice = formatAdvice(adviceStrings);

  return (
    <div className="page" style={{ backgroundImage: `url(${bg.src})` }}>
      <span className="text-[20pt] font-bold absolute pr-[2mm] left-[168mm] leading-[7.322mm] top-[13mm] w-[96mm] h-[6.322mm] text-right">
        {certificate.gearType.title}
      </span>

      <span className="text-[11pt] font-base absolute pr-[2mm] left-[168mm] top-[19.889mm] leading-[5.111mm] w-[96mm] h-[5.111mm] text-right">
        {certificate.program.title?.slice(0, -1).trim()}
      </span>

      <span className="text-[42pt] size-[12mm] text-right font-black text-branding-orange leading-[12mm] absolute left-[264mm] top-[13mm]">
        {certificate.program.degree.rang}
      </span>

      <span className="text-[10pt] text-justify leading-[12pt] flex items-center justify-center absolute left-[23mm] top-[177mm] w-[71mm] h-[22mm]">
        <span>{`${combinedAdvice} Scan de QR-code voor meer informatie.`}</span>
      </span>

      <div className="size-[28mm] absolute left-[100mm] p-[3mm] top-[174mm]">
        <QRCodeSVG
          className="w-full h-full"
          // value={`${BASE_URL.toString().replace(/\/$/, "")}/diploma?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
          value={`https://www.nationaalwatersportdiploma.nl/diploma?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
        />
      </div>

      <p className="absolute w-[108mm] h-[5.512mm] left-[168mm] top-[49.948mm] pt-[1.411mm] font-bold text-[12pt]">
        {[
          certificate.student.firstName,
          certificate.student.lastNamePrefix,
          certificate.student.lastName,
        ]
          .filter(Boolean)
          .join(" ")}
      </p>

      <DataField className="left-[168mm] top-[71.106mm]">
        {dayjs(certificate.student.dateOfBirth).format("DD-MM-YYYY")}
      </DataField>

      <DataField className="left-[223.5mm] top-[71.106mm]">
        {`${certificate.student.birthCity}${certificate.student.birthCountry.code !== "nl" ? ` (${certificate.student.birthCountry.name})` : ""}`}
      </DataField>

      <DataField className="left-[168mm] top-[92.264mm]">
        {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
      </DataField>

      <DataField className="left-[223.5mm] top-[92.264mm]">
        {certificate.handle}
      </DataField>

      {certificate.location.logoCertificate ? (
        <span className="absolute left-[171mm] top-[117.833mm] w-[46.5mm] h-[29mm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="w-full h-full object-contain"
            src={certificate.location.logoCertificate.url}
            alt={certificate.location.logoCertificate.alt ?? ""}
          />
        </span>
      ) : null}

      <span className="absolute left-[20mm] top-[62.5mm] w-[108mm] h-auto grid gap-x-[3mm] gap-y-[6mm] grid-cols-2">
        {modules.map((module) =>
          module.title ? <Module key={module.id} value={module.title} /> : null,
        )}
      </span>
    </div>
  );
}
