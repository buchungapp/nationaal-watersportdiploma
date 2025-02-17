import { CheckIcon } from "@heroicons/react/16/solid";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DialogBody, DialogTitle } from "~/app/(dashboard)/_components/dialog";
import Logo from "~/app/_components/brand/logo";
import Wordmark from "~/app/_components/brand/wordmark";
import dayjs from "~/lib/dayjs";
import { retrieveCertificateById } from "~/lib/nwd";
import background from "../_assets/nwd-2024-cover-bahia-blue.png";
import Module from "./module";
import { TogglePiiButton } from "./toggle-pii";

const DataLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-branding-dark font-semibold uppercase">{children}</p>
);

const MaskComponent = () => (
  <span className="pointer-events-none relative w-20 h-4 inline-block select-none">
    <span className="pointer-events-none absolute inset-0 h-full w-full select-none bg-zinc-950" />
  </span>
);

const DataField = ({
  label,
  value,
  mask = true,
  customMask,
}: {
  label: string;
  value: React.ReactNode;
  mask?: boolean;
  customMask?: (mask: React.ElementType) => React.ReactNode;
}) => {
  const renderMask = () =>
    customMask ? customMask(MaskComponent) : <MaskComponent />;

  return (
    <div className="text-base">
      <DataLabel>{label}</DataLabel>
      <span>
        {mask ? renderMask() : <p className="font-medium">{value}</p>}
      </span>
    </div>
  );
};

export default async function CertificateTemplate({
  id,
  maskPii = true,
}: {
  id: string;
  maskPii?: boolean;
}) {
  const certificate = await retrieveCertificateById(id).catch(() => notFound());

  const degree = certificate.program.degree.rang;

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
    <div className="min-h-full flex flex-col">
      <header className="bg-branding-light space-y-4 flex justify-center flex-col py-4">
        <div className="bg-white flex justify-between rounded-full my-1 mx-4 items-center p-2">
          <div className="flex shrink-0">
            <Logo className="h-24 w-24 p-2 text-white" />
            <Wordmark className="h-24 hidden lg:block" />
          </div>
          <div className="flex gap-4 pr-4">
            <div className="flex flex-col justify-center text-end">
              <p className="text-lg sm:text-xl lg:text-2xl leading-4 font-bold">
                {certificate.gearType.title}
              </p>
              <p className="text-sm sm:text-base leading-4 lg:text-lg">
                {certificate.program.title ?? certificate.program.course.title}
              </p>
            </div>
            <p className="text-6xl font-black text-branding-orange align-text-bottom">
              {degree}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="bg-white h-1 w-full" />
          <div className="bg-white h-1 w-full" />
        </div>
      </header>
      <section className="grid aspect-2/1 w-full relative flex-1 grid-cols-1 lg:grid-cols-2 px-4 sm:px-8 lg:px-16 py-6 gap-16 lg:py-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="relative h-full w-full">
            <Image
              src={background}
              alt=""
              className="h-auto absolute bottom-0 object-bottom inset-x-0 opacity-10"
            />
          </div>
        </div>
        <div className="relative flex flex-col w-full">
          <div>
            <DataLabel>Afgeronde modules</DataLabel>
            <p className="text-base">
              Klik op een module voor meer informatie.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-y-8 gap-x-6">
            {modules.map((module) => {
              return (
                <Module
                  key={module.id}
                  button={
                    <>
                      <span className="font-semibold">{module.title}</span>

                      <div className="flex flex-col gap-y-[4px]">
                        <hr className="w-full h-0.5 bg-branding-dark" />
                        <hr className="w-full h-0.5 bg-branding-dark" />
                      </div>
                    </>
                  }
                >
                  <DialogTitle>{module.title}</DialogTitle>

                  <p className="mt-2 text-pretty text-base/6 text-zinc-500 sm:text-sm/6">
                    Hieronder staan de competenties die onder deze module
                    vallen, en jij hebt laten zien dat je ze beheerst!
                  </p>

                  <DialogBody className="text-sm/6 text-zinc-900">
                    <ul className="flex flex-col gap-y-3.5 divide-y divide-slate-200 pt-2 pb-8">
                      {module.competencies.map((competency) => {
                        return (
                          <li
                            key={competency.id}
                            className="flex flex-col pt-3.5"
                          >
                            <div className="flex items-center">
                              <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
                              <span className="font-semibold">
                                {competency.title}
                              </span>
                            </div>
                            <span className="pl-6">
                              {competency.requirement}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </DialogBody>
                </Module>
              );
            })}
          </div>
        </div>
        <div className="flex relative flex-col gap-4">
          <div className="flex flex-col gap-y-3.5 gap-x-2.5 md:flex-row justify-between items-start">
            <DataField
              label="Naam diplomahouder"
              mask={maskPii}
              customMask={(Mask) => (
                <span className="flex items-center gap-x-2">
                  <span className="font-medium">
                    {certificate.student.firstName}
                  </span>
                  <Mask />
                </span>
              )}
              value={[
                certificate.student.firstName,
                certificate.student.lastNamePrefix,
                certificate.student.lastName,
              ]
                .filter(Boolean)
                .join(" ")}
            />

            <div className="order-first md:order-none shrink-0 md:-mr-[5px] md:-mt-[5px]">
              <TogglePiiButton currentState={maskPii ? "hide" : "show"} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-5">
            <DataField
              mask={maskPii}
              label="Geboortedatum"
              value={dayjs(certificate.student.dateOfBirth).format(
                "DD-MM-YYYY",
              )}
            />

            <DataField
              mask={maskPii}
              label="Geboorteplaats"
              value={certificate.student.birthCity}
            />

            <DataField
              mask={maskPii}
              label="Datum van uitgifte"
              value={dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
            />

            <DataField
              mask={maskPii}
              label="Diplomanummer"
              value={certificate.handle}
            />

            <DataField
              label="Vaarlocatie van uitgifte"
              mask={false}
              value={
                <Link
                  href={certificate.location.websiteUrl ?? "/vaarlocaties"}
                  target="_blank"
                >
                  {certificate.location.logoCertificate ? (
                    <span className="p-2.5 inline-block bg-white max-w-64">
                      <img
                        className="w-full h-auto object-contain"
                        src={certificate.location.logoCertificate.url}
                        alt={certificate.location.logoCertificate.alt ?? ""}
                      />
                    </span>
                  ) : (
                    certificate.location.name
                  )}
                </Link>
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
