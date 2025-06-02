import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { Student, User } from "@nawadi/core";
import { Suspense } from "react";
import { Strong, Text, TextLink } from "~/app/(dashboard)/_components/text";
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
    <ul className="space-y-2">
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

                      return (
                        <ModuleDisclosure
                          key={module.id}
                          module={module}
                          progress={completedModule ? 100 : 0}
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

                        return (
                          <ModuleDisclosure
                            key={module.id}
                            module={module}
                            progress={completedModule ? 100 : 0}
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
                      <li key={certificate.id}>
                        <TextLink
                          target="_blank"
                          href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
                          className="group relative data-active:bg-zinc-100 data-hover:bg-zinc-50 focus:outline-none w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] -mx-2 sm:-mx-4 px-2 sm:px-4 block no-underline"
                        >
                          <span className="absolute inset-0 rounded-lg group-focus:outline-2 group-focus:outline-branding-light group-focus:outline-offset-2" />
                          <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-x-2 min-w-0 flex-1">
                              <Strong className="text-zinc-950">
                                {`#${certificate.handle}`}
                              </Strong>
                              <span className="text-zinc-500 text-sm">
                                {dayjs(certificate.issuedAt).format(
                                  "DD-MM-YYYY",
                                )}
                              </span>
                              <span className="text-zinc-500 text-sm">
                                {certificate.location.name}
                              </span>
                            </div>
                            <ArrowTopRightOnSquareIcon className="size-4 text-zinc-400 group-hover:text-zinc-600 flex-shrink-0" />
                          </div>
                        </TextLink>
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
    return "Geen opleidingen gevonden";
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
