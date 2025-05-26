import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import dayjs from "~/lib/dayjs";
import { getPersonByHandle, listCertificatesForPerson } from "~/lib/nwd";
import {
  ProgressCard,
  ProgressCardBadge,
  ProgressCardDegree,
  ProgressCardDescriptionList,
  ProgressCardDescriptionListItem,
  ProgressCardDisclosure,
  ProgressCardFooter,
  ProgressCardHeader,
  ProgressCardStatus,
  ProgressCardStatusList,
  ProgressCardStatusSubList,
  ProgressCardTitle,
  ProgressCardTitleColored,
  ProgressCardTypeBadge,
} from "./progress-card";

type CertificatesProps = {
  params: Promise<{ handle: string }>;
};

export function fetchCertificates(personId: string) {
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

export async function Certificates({
  certificates,
}: { certificates: Awaited<ReturnType<typeof fetchCertificates>> }) {
  return (
    <ul className="space-y-2">
      {certificates.map((certificate, index) => {
        return (
          <li key={certificate.id}>
            <ProgressCard type="diploma">
              <ProgressCardHeader>
                <ProgressCardTypeBadge />
                <ProgressCardTitle>
                  {certificate.program.title}
                  <ProgressCardTitleColored>
                    {certificate.gearType.title}
                  </ProgressCardTitleColored>
                </ProgressCardTitle>
                <ProgressCardDegree>
                  {certificate.program.degree.title}
                </ProgressCardDegree>
              </ProgressCardHeader>

              <ProgressCardDescriptionList>
                <ProgressCardDescriptionListItem label="Diplomanummer">
                  {certificate.handle}
                </ProgressCardDescriptionListItem>
                <ProgressCardDescriptionListItem label="Datum van afgifte">
                  {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
                </ProgressCardDescriptionListItem>
                <ProgressCardDescriptionListItem label="Vaarlocatie van afgifte">
                  {certificate.location.name}
                </ProgressCardDescriptionListItem>
              </ProgressCardDescriptionList>

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
                <ProgressCardStatusList>
                  {certificate.completedModules.map((m, index) => (
                    <ProgressCardStatus
                      key={m.module.id}
                      title={m.module.title}
                      progress={m.completedAt ? 100 : 0}
                      updatedAt={m.completedAt}
                    >
                      <ProgressCardStatusSubList>
                        {m.module.competencies.map((c) => (
                          <ProgressCardStatus
                            key={c.id}
                            title={c.title}
                            subtitle={c.requirement}
                            progress={100}
                            updatedAt={m.completedAt}
                          />
                        ))}
                      </ProgressCardStatusSubList>
                    </ProgressCardStatus>
                  ))}
                </ProgressCardStatusList>
              </ProgressCardDisclosure>
              <ProgressCardFooter
                waveOffset={index * -30}
                waveSpacing={3 * index}
              >
                {/* <Button plain>
                  <ArrowDownTrayIcon />
                  Download PDF
                </Button> */}
                <Button
                  color="white"
                  target="_blank"
                  href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
                  className="-my-0.5"
                >
                  <ArrowTopRightOnSquareIcon />
                  Bekijk details
                </Button>
              </ProgressCardFooter>
            </ProgressCard>
          </li>
        );
      })}
    </ul>
  );
}

export async function CertificatesContent(props: CertificatesProps) {
  const { handle } = await props.params;
  const person = await getPersonByHandle(handle);
  const certificates = await fetchCertificates(person.id);

  return <Certificates certificates={certificates} />;
}

export function CertificatesFallback() {
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
