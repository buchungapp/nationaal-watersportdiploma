import type { User } from "@nawadi/core";
import { Suspense } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import {
  listCompetencyProgressesByPersonId,
  listCurriculaByIds,
} from "~/lib/nwd";
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
};

export async function fetchCohortProgress(personId: string) {
  const allocations = await listCompetencyProgressesByPersonId(personId, true);

  const uniqueCurricula = new Set(
    allocations.map((allocation) => allocation.curriculumId),
  );

  if (uniqueCurricula.size < 1) {
    throw new Error("No curricula found");
  }

  const allCurriculaData = await listCurriculaByIds(
    Array.from(uniqueCurricula),
  );

  const curriculumDataMap = new Map(
    allCurriculaData.map((curriculum) => [curriculum.id, curriculum]),
  );

  return allocations.map((allocation) => {
    const curriculum = curriculumDataMap.get(allocation.curriculumId);

    if (!curriculum) {
      throw new Error("Curriculum not found");
    }

    return {
      ...allocation,
      curriculum,
    };
  });
}

async function CohortProgress({
  allocations,
}: { allocations: Awaited<ReturnType<typeof fetchCohortProgress>> }) {
  return (
    <ul className="space-y-2">
      {allocations.map((allocation, index) => {
        const completedModules = allocation.curriculum.modules.filter(
          (module) =>
            module.competencies.every((competency) =>
              allocation.progress.some(
                (progress) => progress.competencyId === competency.id,
              ),
            ),
        );

        return (
          <li key={allocation.allocationId}>
            <ProgressCard type="course">
              <ProgressCardHeader
                degree={allocation.degree.name}
                program={allocation.program.name ?? allocation.course.name}
                gearType={allocation.gearType.name}
                itemIndex={index}
              />

              <ProgressCardDisclosures>
                <ProgressCardDisclosure header="Details">
                  <ProgressCardDescriptionList>
                    <ProgressCardDescriptionListItem
                      label="Vaarlocatie van afgifte"
                      className="col-span-full sm:col-span-3"
                    >
                      {allocation.location.name}
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
                    {allocation.curriculum.modules.map(
                      ({ id: moduleId, title, updatedAt, competencies }) => {
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
                            updatedAt={updatedAt}
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
  const allocations = await fetchCohortProgress(person.id);

  if (allocations.length < 1) {
    return (
      <Text className="-mt-2 mb-2">
        We hebben geen lopende cursus voor je gevonden.
      </Text>
    );
  }

  return <CohortProgress allocations={allocations} />;
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
