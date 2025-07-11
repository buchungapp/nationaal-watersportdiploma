import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/16/solid";
import type { Student, User } from "@nawadi/core";
import { Suspense } from "react";
import { TextButton } from "~/app/(dashboard)/_components/button";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listCertificatesForPerson } from "~/lib/nwd";
import {
  Competency,
  ModuleDisclosure,
  ProgressCard,
  ProgressCardBadge,
  ProgressCardDescriptionList,
  ProgressCardDescriptionListItem,
  ProgressCardDisclosure,
  ProgressCardDisclosures,
  ProgressCardEmptyState,
  ProgressCardHeader,
  ProgressCardStatusList,
  ProgressCardStatusSubList,
} from "./progress-card";

type CertificatesProps = {
  personPromise: Promise<User.Person.$schema.Person>;
};

export async function fetchCertificates(personId: string) {
  return listCertificatesForPerson(personId).then(certificatesModules);
}

function certificatesModules(
  certificates: Awaited<ReturnType<typeof listCertificatesForPerson>>,
) {
  return certificates.map((certificate) => {
    return {
      ...certificate,
      completedModules: certificate.completedCompetencies.reduce(
        (acc, completedCompetency) => {
          const completedModule = acc.find(
            (x) =>
              x.module.id ===
              completedCompetency.curriculum_competency.moduleId,
          );
          if (!completedModule) {
            const module = certificate.curriculum.modules.find(
              (module) =>
                module.id ===
                completedCompetency.curriculum_competency.moduleId,
            );
            if (module) {
              acc.push({
                module,
                completedAt:
                  completedCompetency.student_completed_competency.createdAt,
              });
            }
          } else if (
            dayjs(
              completedCompetency.student_completed_competency.createdAt,
            ).isAfter(completedModule.completedAt)
          ) {
            completedModule.completedAt =
              completedCompetency.student_completed_competency.createdAt;
          }

          return acc;
        },
        [] as {
          module: (typeof certificate.curriculum.modules)[number];
          completedAt: string;
        }[],
      ),
    };
  });
}

async function Certificates({
  certificates,
}: { certificates: Awaited<ReturnType<typeof fetchCertificates>> }) {
  return (
    <ul className="space-y-4">
      {certificates.map((certificate, index) => {
        const kernModules = certificate.completedModules.filter(
          (m) => m.module.isRequired,
        );
        const keuzemodules = certificate.completedModules.filter(
          (m) => !m.module.isRequired,
        );

        return (
          <li key={certificate.id}>
            <ProgressCard type="certificate">
              <ProgressCardHeader
                degree={certificate.program.degree.title}
                program={
                  certificate.program.title ?? certificate.program.course.title
                }
                gearType={certificate.gearType.title}
                itemIndex={index}
              />

              <ProgressCardDisclosures>
                <ProgressCardDisclosure header="Details">
                  <ProgressCardDescriptionList>
                    <ProgressCardDescriptionListItem
                      label="Diplomanummer"
                      className="col-span-full sm:col-span-2"
                    >
                      {certificate.handle}
                    </ProgressCardDescriptionListItem>
                    <ProgressCardDescriptionListItem
                      label="Datum van afgifte"
                      className="col-span-full sm:col-span-2"
                    >
                      {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
                    </ProgressCardDescriptionListItem>
                    <ProgressCardDescriptionListItem
                      label="Vaarlocatie van afgifte"
                      className="col-span-full sm:col-span-2"
                    >
                      {certificate.location.name}
                    </ProgressCardDescriptionListItem>
                    <div className="col-span-full flex justify-end gap-x-4 sm:gap-x-6 mt-2">
                      <TextButton
                        href={`/api/export/certificate/pdf/${certificate.id}?preview=true&signed=true&handle=${certificate.handle}&issuedDate=${dayjs(
                          certificate.issuedAt,
                        ).format(
                          "YYYYMMDD",
                        )}&filename=nationaal-watersportdiploma_nwd-${certificate.handle}-${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
                        target="_blank"
                      >
                        <ArrowDownTrayIcon />
                        Download PDF
                      </TextButton>
                      <TextButton
                        href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
                        target="_blank"
                      >
                        <ArrowTopRightOnSquareIcon />
                        Bekijk online
                      </TextButton>
                    </div>
                  </ProgressCardDescriptionList>
                </ProgressCardDisclosure>

                <ProgressCardDisclosure
                  header={
                    <>
                      Behaalde modules{" "}
                      <ProgressCardBadge>
                        {certificate.completedModules.length}
                      </ProgressCardBadge>
                    </>
                  }
                >
                  <Text>Kernmodules</Text>
                  {kernModules.length > 0 ? (
                    <ProgressCardStatusList>
                      {kernModules.map(({ module }) => (
                        <ModuleDisclosure
                          key={module.id}
                          module={
                            module as Student.Curriculum.$schema.StudentCurriculum["curriculum"]["modules"][number]
                          }
                          progress={100}
                        >
                          <ProgressCardStatusSubList>
                            {module.competencies.map((c) => (
                              <Competency
                                key={c.id}
                                competency={c}
                                progress={100}
                              />
                            ))}
                          </ProgressCardStatusSubList>
                        </ModuleDisclosure>
                      ))}
                    </ProgressCardStatusList>
                  ) : (
                    <Text className="italic">Geen kernmodules</Text>
                  )}
                  <Text className="mt-2">Keuzemodules</Text>
                  {keuzemodules.length > 0 ? (
                    <ProgressCardStatusList>
                      {keuzemodules.map(({ module }) => (
                        <ModuleDisclosure
                          key={module.id}
                          module={
                            module as Student.Curriculum.$schema.StudentCurriculum["curriculum"]["modules"][number]
                          }
                          progress={100}
                        >
                          <ProgressCardStatusSubList>
                            {module.competencies.map((c) => (
                              <Competency
                                key={c.id}
                                competency={c}
                                progress={100}
                              />
                            ))}
                          </ProgressCardStatusSubList>
                        </ModuleDisclosure>
                      ))}
                    </ProgressCardStatusList>
                  ) : (
                    <Text className="italic">Geen keuzemodules</Text>
                  )}
                </ProgressCardDisclosure>
              </ProgressCardDisclosures>
            </ProgressCard>
          </li>
        );
      })}
    </ul>
  );
}

async function CertificatesContent(props: CertificatesProps) {
  const person = await props.personPromise;
  const certificates = await fetchCertificates(person.id);

  if (certificates.length < 1) {
    return <ProgressCardEmptyState type="certificate" />;
  }

  return <Certificates certificates={certificates} />;
}

function CertificatesFallback() {
  return (
    <ul className="space-y-2">
      <li className="bg-gray-200 rounded w-full h-68.5 animate-pulse" />
    </ul>
  );
}

export function CertificatesWithSuspense(props: CertificatesProps) {
  return (
    <Suspense fallback={<CertificatesFallback />}>
      <CertificatesContent {...props} />
    </Suspense>
  );
}
