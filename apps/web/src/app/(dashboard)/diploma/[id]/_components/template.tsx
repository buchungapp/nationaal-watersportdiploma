import dayjs from "dayjs";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DialogBody, DialogTitle } from "~/app/(dashboard)/_components/dialog";
import Logo from "~/app/_components/brand/logo";
import Wordmark from "~/app/_components/brand/wordmark";
import { retrieveCertificateById } from "~/lib/nwd";
import Module from "./module";

const DataLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-branding-dark font-semibold uppercase">{children}</p>
);

const DataField = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="text-base">
    <DataLabel>{label}</DataLabel>
    <p className="font-medium">{value}</p>
  </div>
);

export default async function CertificateTemplate({ id }: { id: string }) {
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
              <p className="text-lg sm:text-xl leading-1 lg:text-2xl font-bold">
                {certificate.gearType.title}
              </p>
              <p className="text-sm sm:text-base leading-1 lg:text-lg">
                {certificate.program.title?.slice(0, -1).trim()}
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
      <section className="grid flex-1 grid-cols-1 lg:grid-cols-2 px-4 sm:px-8 lg:px-16 py-6 gap-16 lg:py-12">
        <div className="flex flex-col w-full">
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
                    Lees hieronder welke competenties vallen onder deze module,
                    en jij hebt laten zien dat je beheerst!
                  </p>

                  <DialogBody className="text-sm/6 text-zinc-900">
                    <ul className="flex flex-col gap-y-3.5 divide-y divide-gray-200 pt-4 pb-8">
                      {module.competencies.map((competency) => {
                        return (
                          <li className="flex flex-col pt-3.5">
                            <span className="font-semibold">
                              {competency.title}
                            </span>
                            <span>{competency.requirement}</span>
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
        <div className="flex flex-col gap-4">
          <DataField
            label="NAAM DIPLOMAHOUDER"
            value={[
              certificate.student.firstName,
              certificate.student.lastNamePrefix,
              certificate.student.lastName,
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-5">
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

            <DataField
              label="Vaarlocatie van uitgifte"
              value={
                certificate.location.logoCertificate ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="w-full h-auto object-contain"
                    src={certificate.location.logoCertificate.url}
                    alt={certificate.location.logoCertificate.alt ?? ""}
                  />
                ) : (
                  certificate.location.name
                )
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
