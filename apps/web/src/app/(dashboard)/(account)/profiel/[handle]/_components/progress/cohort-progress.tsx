import { Suspense } from "react";
import dayjs from "~/lib/dayjs";
import {
  getPersonByHandle,
  listCompetencyProgressesByPersonId,
} from "~/lib/nwd";
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

type CohortProgressProps = {
  params: Promise<{ handle: string }>;
};

export function fetchCohortProgress(personId: string) {
  return listCompetencyProgressesByPersonId(personId, true).then(
    allocationModules,
  );
}

function allocationModules(
  allocations: Awaited<ReturnType<typeof listCompetencyProgressesByPersonId>>,
) {
  return allocations.map((allocation) => {
    return {
      ...allocation,
      modules: allocation.modules.map((module) => {
        const progress =
          module.competencies.length > 0
            ? module.competencies
                .map((competency) =>
                  competency.completed
                    ? 100
                    : (competency.progress?.progress ?? 0),
                )
                .reduce((a, b) => a + b, 0) / module.competencies.length
            : 0;

        const updateDates = module.competencies.flatMap((competency) => [
          ...(competency.progress?.updatedAt
            ? [dayjs(competency.progress?.updatedAt)]
            : []),
          ...(competency.completed?.createdAt
            ? [dayjs(competency.completed.createdAt)]
            : []),
        ]);

        const updatedAt = dayjs.max(updateDates)?.toISOString();

        return {
          ...module,
          progress,
          updatedAt,
        };
      }),
    };
  });
}

export async function CohortProgress({
  allocations,
}: { allocations: Awaited<ReturnType<typeof fetchCohortProgress>> }) {
  return (
    <ul className="space-y-2">
      {allocations.map((allocation, index) => {
        return (
          <li key={allocation.cohortAllocationId}>
            <ProgressCard type="cursus">
              <ProgressCardHeader>
                <ProgressCardTypeBadge />
                <ProgressCardTitle>
                  {allocation.program.title}
                  <ProgressCardTitleColored>
                    {allocation.gearType.title}
                  </ProgressCardTitleColored>
                </ProgressCardTitle>
                <ProgressCardDegree>
                  {allocation.degree.title}
                </ProgressCardDegree>
              </ProgressCardHeader>

              <ProgressCardDescriptionList>
                <ProgressCardDescriptionListItem label="Vaarlocatie van afgifte">
                  {allocation.location.name}
                </ProgressCardDescriptionListItem>
                <ProgressCardDescriptionListItem label="Voortgang bijgewerkt tot">
                  {dayjs(allocation.progressVisibleUpUntil).format(
                    "DD-MM-YYYY",
                  )}
                </ProgressCardDescriptionListItem>
              </ProgressCardDescriptionList>

              <ProgressCardDisclosure
                header={
                  <>
                    Voortgang{" "}
                    <ProgressCardBadge>
                      {
                        allocation.modules.filter(
                          ({ progress }) => progress >= 100,
                        ).length
                      }
                    </ProgressCardBadge>
                  </>
                }
              >
                <ProgressCardStatusList>
                  {allocation.modules.map(
                    ({ module, progress, updatedAt, competencies }) => (
                      <ProgressCardStatus
                        key={module.id}
                        progress={progress}
                        title={module.title}
                        updatedAt={updatedAt}
                      >
                        <ProgressCardStatusSubList>
                          {competencies.map((competency) => {
                            const progress = competency.completed
                              ? 100
                              : (competency.progress?.progress ?? 0);
                            return (
                              <ProgressCardStatus
                                key={competency.id}
                                progress={progress}
                                title={competency.title}
                                subtitle={competency.requirement}
                                updatedAt={
                                  competency.progress?.updatedAt ??
                                  competency.completed?.createdAt
                                }
                              />
                            );
                          })}
                        </ProgressCardStatusSubList>
                      </ProgressCardStatus>
                    ),
                  )}
                </ProgressCardStatusList>
              </ProgressCardDisclosure>
              <ProgressCardFooter
                waveOffset={index * -30}
                waveSpacing={3 * index}
              />
            </ProgressCard>
          </li>
        );
      })}
    </ul>
  );
}

export async function CohortProgressContent(props: CohortProgressProps) {
  const { handle } = await props.params;
  const person = await getPersonByHandle(handle);
  const allocations = await fetchCohortProgress(person.id);
  return <CohortProgress allocations={allocations} />;
}

export function CohortProgressFallback() {
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
