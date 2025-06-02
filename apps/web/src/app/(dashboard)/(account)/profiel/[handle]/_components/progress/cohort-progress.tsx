import type { Student, User } from "@nawadi/core";
import { Suspense } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listStudentCohortProgressByPersonId } from "~/lib/nwd";
import { invariant } from "~/utils/invariant";
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

type CohortProgressProps = {
  personPromise: Promise<User.Person.$schema.Person>;
  curriculaPromise: Promise<Student.Curriculum.$schema.StudentCurriculum[]>;
};

export async function fetchCohortProgress(personId: string) {
  return listStudentCohortProgressByPersonId(personId, true, true);
}

async function CohortProgress({
  allocationProgress,
  studentCurricula,
}: {
  allocationProgress: Awaited<ReturnType<typeof fetchCohortProgress>>;
  studentCurricula: Student.Curriculum.$schema.StudentCurriculum[];
}) {
  return (
    <ul className="space-y-2">
      {allocationProgress.map((allocation, index) => {
        const studentCurriculum = studentCurricula.find(
          (studentCurriculum) =>
            studentCurriculum.id === allocation.studentCurriculumId,
        );

        invariant(studentCurriculum, "Curriculum not found");

        const completedModules = studentCurriculum.curriculum.modules.filter(
          (module) =>
            module.competencies.every((competency) => {
              const progress = allocation.progress.find(
                (p) => p.competencyId === competency.id,
              );
              return progress && progress.progress >= 100;
            }),
        );

        const kernModules = studentCurriculum.curriculum.modules.filter(
          (module) => module.isRequired,
        );

        const keuzemodules = studentCurriculum.curriculum.modules.filter(
          (module) => !module.isRequired,
        );

        return (
          <li key={allocation.allocation.id}>
            <ProgressCard type="course">
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
                      label="Vaarlocatie"
                      className="col-span-full sm:col-span-3"
                    >
                      {allocation.allocation.cohort.location.name}
                    </ProgressCardDescriptionListItem>
                    <ProgressCardDescriptionListItem
                      label="Voortgang bijgewerkt tot"
                      className="col-span-full sm:col-span-3"
                    >
                      {dayjs(allocation.progressVisibleUpUntil).format(
                        "DD-MM-YYYY",
                      )}
                    </ProgressCardDescriptionListItem>
                  </ProgressCardDescriptionList>
                </ProgressCardDisclosure>

                <ProgressCardDisclosure
                  header={
                    <>
                      Voortgang{" "}
                      <ProgressCardBadge>
                        {completedModules.length}
                      </ProgressCardBadge>
                    </>
                  }
                >
                  <Text>Kernmodules</Text>
                  <ProgressCardStatusList>
                    {kernModules.map((module) => {
                      const totalProgressSumOfAllModuleCompetencies =
                        module.competencies.reduce((acc, competency) => {
                          const progress = allocation.progress.find(
                            (progress) =>
                              progress.competencyId === competency.id,
                          );
                          return acc + (progress?.progress ?? 0);
                        }, 0);

                      const progress =
                        totalProgressSumOfAllModuleCompetencies /
                        module.competencies.length;

                      return (
                        <ModuleDisclosure
                          key={module.id}
                          module={module}
                          progress={progress}
                        >
                          <ProgressCardStatusSubList>
                            {module.competencies.map((competency) => {
                              const progress = allocation.progress.find(
                                (progress) =>
                                  progress.competencyId === competency.id,
                              );
                              return (
                                <Competency
                                  key={competency.id}
                                  progress={progress?.progress ?? 0}
                                  competency={competency}
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
                        const totalProgressSumOfAllModuleCompetencies =
                          module.competencies.reduce((acc, competency) => {
                            const progress = allocation.progress.find(
                              (progress) =>
                                progress.competencyId === competency.id,
                            );
                            return acc + (progress?.progress ?? 0);
                          }, 0);

                        const progress =
                          totalProgressSumOfAllModuleCompetencies /
                          module.competencies.length;

                        return (
                          <ModuleDisclosure
                            key={module.id}
                            progress={progress}
                            module={module}
                          >
                            <ProgressCardStatusSubList>
                              {module.competencies.map((competency) => {
                                const progress = allocation.progress.find(
                                  (progress) =>
                                    progress.competencyId === competency.id,
                                );
                                return (
                                  <Competency
                                    key={competency.id}
                                    progress={progress?.progress ?? 0}
                                    competency={competency}
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
              </ProgressCardDisclosures>
            </ProgressCard>
          </li>
        );
      })}
    </ul>
  );
}

async function CohortProgressContent(props: CohortProgressProps) {
  const person = await props.personPromise;
  const [allocations, curricula] = await Promise.all([
    fetchCohortProgress(person.id),
    props.curriculaPromise,
  ]);

  if (allocations.length < 1) {
    return (
      <Text className="-mt-2 mb-2">
        We hebben geen lopende cursus voor je gevonden.
      </Text>
    );
  }

  return (
    <CohortProgress
      allocationProgress={allocations}
      studentCurricula={curricula}
    />
  );
}

function CohortProgressFallback() {
  return (
    <ul className="space-y-2">
      <li className="bg-gray-200 rounded w-full h-68.5 animate-pulse" />
    </ul>
  );
}

export function CohortProgressWithSuspense(props: CohortProgressProps) {
  return (
    <Suspense fallback={<CohortProgressFallback />}>
      <CohortProgressContent {...props} />
    </Suspense>
  );
}
