import type { User } from "@nawadi/core";
import { Suspense } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listCompetencyProgressesByPersonId } from "~/lib/nwd";
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

async function CohortProgress({
  allocations,
}: { allocations: Awaited<ReturnType<typeof fetchCohortProgress>> }) {
  if (allocations.length === 0) {
    return (
      <Text className="-mt-2 mb-2">
        We hebben geen lopende cursus voor je gevonden.
      </Text>
    );
  }

  return (
    <ul className="space-y-2">
      {allocations.map((allocation, index) => {
        return (
          <li key={allocation.cohortAllocationId}>
            <ProgressCard type="course">
              <ProgressCardHeader
                degree={allocation.degree.title}
                program={allocation.program.title}
                gearType={allocation.gearType.title}
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
