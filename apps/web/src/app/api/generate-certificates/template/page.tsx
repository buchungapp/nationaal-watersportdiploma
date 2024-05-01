import { constants } from "@nawadi/lib";
import clsx from "clsx";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import QRCode from "react-qr-code";
import { z } from "zod";
import { findCertificate } from "~/lib/nwd";
import "./styles.css";

dayjs.extend(customParseFormat);

const DataLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[#1B4D90] font-medium print:invisible">{children}</p>
);

const DataField = ({
  label,
  value,
  isBold,
}: {
  label: string;
  value?: string | null;
  isBold?: boolean;
}) => (
  <div className="text-[12pt]">
    <DataLabel>{label}</DataLabel>
    <p className={clsx({ "font-bold": isBold, "font-medium": !isBold })}>
      {value}
    </p>
  </div>
);

const StampField = ({ label, src }: { label: string; src?: string }) => (
  <div className="text-[12pt]">
    <DataLabel>{label}</DataLabel>
    <div className="w-full h-36 bg-white p-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img className="h-full w-full" src={src} alt="" /> : null}
    </div>
  </div>
);

const AdviceField = ({ label, value }: { label: string; value: string }) => (
  <div className="text-[12pt]">
    <DataLabel>{label}</DataLabel>
    <div className="w-full h-24 bg-white p-1">{value}</div>
  </div>
);

const QRField = ({ value }: { value: string }) => (
  <div className="w-24 h-24 bg-white p-2">
    <QRCode
      value={value}
      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
    />
  </div>
);

const Module = ({ value }: { value: string }) => (
  <p className="flex flex-col">
    <span className="text-[9pt] font-medium -mb-3">{value}</span>
    <span className="text-[#1B4D90] h-0.5">{"_".repeat(30)}</span>
    <span className="text-[#1B4D90] h-0.5 mt-0.5">{"_".repeat(30)}</span>
  </p>
);

interface PageProps {
  searchParams: {
    issueLocationSrc?: string;
    notes?: string;
    advice?: string;
    nummer?: string;
    datum?: string;
  };
}

export default async function Page({ searchParams }: PageProps) {
  const parsed = z
    .object({
      handle: z.string(),
      // String in YYYYMMDD format
      issuedDate: z
        .string()
        .refine((datestr) => dayjs(datestr, "YYYYMMDD"))
        .transform((datestr) => dayjs(datestr, "YYYYMMDD")),
    })
    .safeParse({
      handle: searchParams.nummer,
      issuedDate: searchParams.datum,
    });

  if (!parsed.success) {
    notFound();
  }

  const certificate = await findCertificate({
    handle: parsed.data.handle,
    issuedAt: parsed.data.issuedDate.toISOString(),
  });

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

  return (
    <div className="page">
      <header className="bg-[#2764A2] space-y-4 flex justify-center flex-col py-4">
        <div className="bg-white flex justify-between rounded-full my-1 mx-4 items-center p-2">
          <div className="print:invisible">Logo</div>
          <div className="flex gap-4 pr-4">
            <div className="flex flex-col justify-center text-end">
              <p className="text-[20pt] font-bold">
                {certificate.gearType.title}
              </p>
              <p className="text-[12pt] font-medium">
                {certificate.program.title?.slice(0, -1).trim()}
              </p>
            </div>
            <p className="text-[42pt] font-black text-[#CA752E] align-text-bottom">
              {certificate.program.degree.rang}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="bg-white h-1 w-full" />
          <div className="bg-white h-1 w-full" />
        </div>
      </header>
      <section className="flex grow px-16 py-6 bg-slate-400 gap-16">
        <div className="basis-1/2 flex flex-col justify-between w-full">
          <div>
            <p className="font-bold text-[12pt] print:invisible">
              Gefeliciteerd! Een nieuw diploma!
            </p>
            <p className="text-[12pt] print:invisible">
              De volgende modules heb je succesvol afgerond:
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {modules.map((module) =>
              module.title ? (
                <Module key={module.id} value={module.title} />
              ) : null,
            )}
          </div>
          <div className="grid grid-cols-[1fr_100px] items-end gap-4">
            <AdviceField
              label="JOUW VERVOLGADVIES"
              value={searchParams?.advice ?? ""}
            />

            <QRField
              value={`${constants.WEBSITE_URL}/diploma?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
            />
          </div>
        </div>
        <div className="flex basis-1/2 flex-col gap-4 justify-between">
          <DataField
            label="NAAM DIPLOMAHOUDER"
            isBold={true}
            value={[
              certificate.student.firstName,
              certificate.student.lastNamePrefix,
              certificate.student.lastName,
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <DataField
              label="GEBOORTEDATUM"
              value={dayjs(certificate.student.dateOfBirth).format(
                "DD-MM-YYYY",
              )}
            />

            <DataField
              label="GEBOORTEPLAATS"
              value={certificate.student.birthCity}
            />

            <DataField
              label="DATUM VAN AFGIFTE"
              value={dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
            />

            <DataField label="DIPLOMANUMMER" value={certificate.handle} />

            <StampField
              label="VAARLOCATIE VAN UITGIFTE"
              src={searchParams?.issueLocationSrc}
            />

            <StampField label="HANDTEKENING/STEMPEL" />
          </div>
          <div>
            <DataLabel>OPMERKINGEN</DataLabel>
            <div className="relative flex justify-start items-start w-full h-36 bg-white overflow-hidden text-lg text-[#2764A2] px-6 pt-2 pb-6">
              <p className="absolute inset-x-6 top-2 bottom-6 print:invisible">
                {"_ ".repeat(128)}
              </p>
              <p className="text-black">{searchParams?.notes}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
