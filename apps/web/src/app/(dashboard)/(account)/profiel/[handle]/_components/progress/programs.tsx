import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import type { Student, User } from "@nawadi/core";
import clsx from "clsx";
import { Suspense } from "react";
import { Link } from "~/app/(dashboard)/_components/link";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listCurriculaProgressByPersonId } from "~/lib/nwd";
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

type ProgramsProps = {
  personPromise: Promise<User.Person.$schema.Person>;
  curriculaPromise: Promise<Student.Curriculum.$schema.StudentCurriculum[]>;
};

export async function fetchCurriculaProgress(personId: string) {
  return listCurriculaProgressByPersonId(personId, true, true);
}

async function Programs({
  curriculaProgress,
  curricula,
}: {
  curriculaProgress: Awaited<ReturnType<typeof fetchCurriculaProgress>>;
  curricula: Student.Curriculum.$schema.StudentCurriculum[];
}) {
  return (
    <ul className="space-y-4">
      {curricula.map((studentCurriculum, index) => {
        const curriculumProgress = curriculaProgress.find(
          (c) => c.studentCurriculumId === studentCurriculum.id,
        );

        const firstCompletedCertificate =
          curriculumProgress?.certificates.at(0);
        const mostRecentCompletedCertificate =
          curriculumProgress?.certificates.at(-1);

        const kernModules = studentCurriculum.curriculum.modules.filter(
          (m) => m.isRequired,
        );
        const keuzemodules = studentCurriculum.curriculum.modules.filter(
          (m) => !m.isRequired,
        );

        return (
          <li key={studentCurriculum.id}>
            <ProgressCard type="program">
              <ProgressCardHeader
                degree={studentCurriculum.curriculum.program.degree.title}
                program={
                  studentCurriculum.curriculum.program.title ??
                  studentCurriculum.curriculum.program.course.title
                }
                gearType={studentCurriculum.gearType.title}
                itemIndex={index}
              />

              <ProgressCardDisclosures>
                <ProgressCardDisclosure header="Details">
                  <ProgressCardDescriptionList>
                    <ProgressCardDescriptionListItem
                      label="Curriculum"
                      className="col-span-full sm:col-span-2"
                    >
                      {studentCurriculum.curriculum.revision}
                    </ProgressCardDescriptionListItem>
                    <ProgressCardDescriptionListItem
                      label="Eerst behaalde diploma"
                      className="col-span-full sm:col-span-2"
                    >
                      {firstCompletedCertificate
                        ? dayjs(firstCompletedCertificate.issuedAt).format(
                            "DD-MM-YYYY",
                          )
                        : "-"}
                    </ProgressCardDescriptionListItem>
                    <ProgressCardDescriptionListItem
                      label="Meest recente diploma"
                      className="col-span-full sm:col-span-2"
                    >
                      {mostRecentCompletedCertificate
                        ? dayjs(mostRecentCompletedCertificate.issuedAt).format(
                            "DD-MM-YYYY",
                          )
                        : "-"}
                    </ProgressCardDescriptionListItem>
                  </ProgressCardDescriptionList>
                </ProgressCardDisclosure>

                <ProgressCardDisclosure
                  header={
                    <>
                      Opleidingsprogramma{" "}
                      <ProgressCardBadge>
                        {curriculumProgress?.modules.length ?? 0}
                      </ProgressCardBadge>
                    </>
                  }
                >
                  <Text>Kernmodules</Text>
                  <ProgressCardStatusList>
                    {kernModules.map((module) => {
                      const completedModule = curriculumProgress?.modules.find(
                        (m) => m.moduleId === module.id,
                      );

                      const relevantCertificate =
                        curriculumProgress?.certificates.find(
                          (c) => c.id === completedModule?.certificateId,
                        );

                      return (
                        <ModuleDisclosure
                          key={module.id}
                          module={module}
                          progress={completedModule ? 100 : 0}
                          certificate={relevantCertificate}
                        >
                          <ProgressCardStatusSubList>
                            {module.competencies.map((c) => {
                              return (
                                <Competency
                                  key={c.id}
                                  competency={c}
                                  progress={completedModule ? 100 : 0}
                                />
                              );
                            })}
                          </ProgressCardStatusSubList>
                        </ModuleDisclosure>
                      );
                    })}
                  </ProgressCardStatusList>
                  <Text className="mt-2">Keuzemodules</Text>
                  {keuzemodules.length > 0 ? (
                    <ProgressCardStatusList>
                      {keuzemodules.map((module) => {
                        const completedModule =
                          curriculumProgress?.modules.find(
                            (m) => m.moduleId === module.id,
                          );

                        const relevantCertificate =
                          curriculumProgress?.certificates.find(
                            (c) => c.id === completedModule?.certificateId,
                          );

                        return (
                          <ModuleDisclosure
                            key={module.id}
                            module={module}
                            progress={completedModule ? 100 : 0}
                            certificate={relevantCertificate}
                          >
                            <ProgressCardStatusSubList>
                              {module.competencies.map((c) => {
                                return (
                                  <Competency
                                    key={c.id}
                                    competency={c}
                                    progress={completedModule ? 100 : 0}
                                  />
                                );
                              })}
                            </ProgressCardStatusSubList>
                          </ModuleDisclosure>
                        );
                      })}
                    </ProgressCardStatusList>
                  ) : (
                    <Text className="italic">Geen keuzemodules</Text>
                  )}
                </ProgressCardDisclosure>
                <ProgressCardDisclosure
                  disabled={curriculumProgress?.certificates.length === 0}
                  header={
                    <>
                      Behaalde diploma's{" "}
                      <ProgressCardBadge>
                        {curriculumProgress?.certificates.length ?? 0}
                      </ProgressCardBadge>
                    </>
                  }
                >
                  <ProgressCardStatusList>
                    {curriculumProgress?.certificates.map((certificate) => (
                      <li key={certificate.id} className="w-full">
                        <Link
                          target="_blank"
                          href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
                          className={clsx(
                            // Base
                            "relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg text-base/6 font-semibold",

                            // Sizing
                            "py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm/6",

                            // Focus
                            "focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-branding-light",
                            "w-full data-active:bg-zinc-950/5 data-hover:bg-zinc-950/5",
                          )}
                        >
                          <div className="flex w-full justify-between gap-x-2 items-center">
                            <div className="w-full flex items-center gap-x-2.5">
                              <Strong className="text-blue-800 tabular-nums">
                                {`#${certificate.handle}`}
                              </Strong>
                              <span className="text-zinc-500 font-normal text-sm tabular-nums">
                                {dayjs(certificate.issuedAt).format(
                                  "DD-MM-YYYY",
                                )}
                              </span>
                              <span className="text-zinc-500 font-normal text-sm">
                                {certificate.location.name}
                              </span>
                            </div>
                            <ArrowTopRightOnSquareIcon className="size-4 text-zinc-400 group-hover:text-zinc-600 flex-shrink-0" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ProgressCardStatusList>
                </ProgressCardDisclosure>
              </ProgressCardDisclosures>
            </ProgressCard>
          </li>
        );
      })}
    </ul>
  );
}

async function ProgramsContent(props: ProgramsProps) {
  const person = await props.personPromise;
  const [curriculaProgress, curricula] = await Promise.all([
    fetchCurriculaProgress(person.id),
    props.curriculaPromise,
  ]);

  const onlyCurriculaWithProgress = curricula.filter((c) =>
    curriculaProgress.some(
      (p) => p.studentCurriculumId === c.id && p.modules.length > 0,
    ),
  );

  if (onlyCurriculaWithProgress.length < 1) {
    return <ProgressCardEmptyState type="program" />;
  }

  return (
    <Programs
      curriculaProgress={curriculaProgress}
      curricula={onlyCurriculaWithProgress}
    />
  );
}

function ProgramsFallback() {
  return (
    <ul className="space-y-2">
      <li className="bg-gray-200 rounded w-full h-81.75 animate-pulse" />
    </ul>
  );
}

export function ProgramsWithSuspense(props: ProgramsProps) {
  return (
    <Suspense fallback={<ProgramsFallback />}>
      <ProgramsContent {...props} />
    </Suspense>
  );
}
