import type { Student, User } from "@nawadi/core";
import { Suspense } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listStudentCohortProgressByPersonId } from "~/lib/nwd";
import { invariant } from "~/utils/invariant";
import {
  ProgressCard,
  ProgressCardBadge,
  ProgressCardDescriptionList,
  ProgressCardDescriptionListItem,
  ProgressCardDisclosure,
  ProgressCardDisclosures,
  ProgressCardHeader,
  ProgressCardStatus,
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
                  <ProgressCardStatusList>
                    {studentCurriculum.curriculum.modules.map(
                      ({ id: moduleId, title, competencies }) => {
                        const totalProgressSumOfAllModuleCompetencies =
                          competencies.reduce((acc, competency) => {
                            const progress = allocation.progress.find(
                              (progress) =>
                                progress.competencyId === competency.id,
                            );
                            return acc + (progress?.progress ?? 0);
                          }, 0);

                        const progress =
                          totalProgressSumOfAllModuleCompetencies /
                          competencies.length;

                        return (
                          <ProgressCardStatus
                            key={moduleId}
                            progress={progress}
                            title={title}
                          >
                            <ProgressCardStatusSubList>
                              {competencies.map((competency) => {
                                const progress = allocation.progress.find(
                                  (progress) =>
                                    progress.competencyId === competency.id,
                                );
                                return (
                                  <ProgressCardStatus
                                    key={competency.id}
                                    progress={progress?.progress ?? 0}
                                    title={competency.title}
                                    subtitle={competency.requirement}
                                    updatedAt={progress?.createdAt}
                                  />
                                );
                              })}
                            </ProgressCardStatusSubList>
                          </ProgressCardStatus>
                        );
                      },
                    )}
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
