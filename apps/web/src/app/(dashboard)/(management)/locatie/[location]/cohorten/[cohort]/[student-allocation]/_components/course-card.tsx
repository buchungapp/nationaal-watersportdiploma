import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import { SWRConfig } from "swr";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Strong, Text, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import {
  listCompetencyProgressInCohortForStudent,
  listCompletedCompetenciesByStudentCurriculumId,
  listPrograms,
  retrieveCohortByHandle,
  retrieveCurriculumById,
  retrieveLocationByHandle,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import { StartStudentCurriculum } from "./start-curriculum";
import {
  CompleteAllCoreModules,
  CourseCardProvider,
  CourseCardViewSettings,
  Module,
  ModuleFallback,
} from "./student-module";

type CourseCardProps = {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
};

async function CourseCardContent(props: CourseCardProps) {
  const params = await props.params;

  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  const allocation = await retrieveStudentAllocationWithCurriculum(
    cohort.id,
    params["student-allocation"],
  );

  if (!allocation) {
    notFound();
  }

  if (!allocation.studentCurriculum) {
    return (
      <SWRConfig
        value={{
          fallback: {
            // Note that there is no `await` here,
            // so it only blocks rendering of components that
            // actually rely on this data.
            allPrograms: listPrograms(),
          },
        }}
      >
        <StartStudentCurriculum
          allocationId={allocation.id}
          cohortId={cohort.id}
          personId={allocation.person.id}
        />
      </SWRConfig>
    );
  }

  if (!allocation.studentCurriculum.curriculumId) {
    throw new Error("Failed to retrieve curriculum");
  }

  const [curriculum, completedCompetencies, allCompetencyProgress] =
    await Promise.all([
      retrieveCurriculumById(allocation.studentCurriculum.curriculumId),
      listCompletedCompetenciesByStudentCurriculumId(
        allocation.studentCurriculum.id,
      ),
      listCompetencyProgressInCohortForStudent(allocation.id),
    ]);

  if (!curriculum) {
    throw new Error("Failed to retrieve curriculum");
  }

  const hasFinishedCompetencesOnPreviousCertificate =
    completedCompetencies.length > 0;

  const completedCompetencyIds = completedCompetencies.map(
    (cc) => cc.competencyId,
  );

  const competencyProgressMap = allCompetencyProgress.map((cp) => ({
    id: cp.competencyId,
    progress: Number(cp.progress),
  }));

  const hasIssuedCertificate = !!allocation.certificate;

  return (
    <CourseCardProvider>
      <div>
        <DescriptionList>
          <DescriptionTerm>Programma</DescriptionTerm>
          <DescriptionDetails>
            <TextLink
              href={`/diplomalijn/consument/disciplines/${allocation.studentCurriculum.discipline.handle}/${allocation.studentCurriculum.course.handle}`}
              target="_blank"
              className="flex items-center gap-1"
            >
              {allocation.studentCurriculum.program.title ??
                `${allocation.studentCurriculum.course.title} ${allocation.studentCurriculum.degree.title}`}
              <ArrowTopRightOnSquareIcon className="size-4" />
            </TextLink>
          </DescriptionDetails>

          <DescriptionTerm>Vaartuig</DescriptionTerm>
          <DescriptionDetails>
            {allocation.studentCurriculum.gearType.title}
          </DescriptionDetails>
        </DescriptionList>

        {hasIssuedCertificate ? (
          <Text className="my-4">
            Dit diploma is uitgegeven op{" "}
            <Strong>
              {dayjs(allocation.certificate?.issuedAt)
                .tz()
                .format("DD-MM-YYYY HH:mm uur")}
            </Strong>
            . Om aanpassingen in de cursuskaart te kunnen doen moet een
            cohortbeheerder het diploma eerst verwijderen.
          </Text>
        ) : null}

        <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-2 mt-2">
          <CompleteAllCoreModules
            disabled={hasIssuedCertificate}
            cohortAllocationId={allocation.id}
            competencyIds={curriculum.modules
              .filter((m) => m.isRequired)
              .flatMap((module) => module.competencies.map((c) => c.id))
              .filter((c) => {
                // Filter out if already in completedCompetencyIds or
                // if progress is >= 100 in competencyProgressMap
                const completed = completedCompetencyIds.includes(c);
                const progress = competencyProgressMap.find(
                  (cp) => cp.id === c,
                );

                return !completed && (!progress || progress.progress < 100);
              })}
          />

          <CourseCardViewSettings />
        </div>

        {hasFinishedCompetencesOnPreviousCertificate &&
        !hasIssuedCertificate ? (
          <div className="bg-blue-50 mt-6 p-4 rounded-md">
            <div className="flex">
              <div className="shrink-0">
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="size-5 text-blue-400"
                />
              </div>
              <div className="ml-3">
                <p className="text-blue-700 text-sm">
                  De cursist heeft al competenties afgerond voor dit programma
                  via een eerder uitgegeven diploma, deze zijn niet opnieuw af
                  te ronden en grijs weergegeven.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          {curriculum.modules.map((module, index) => {
            return (
              <React.Fragment key={module.id}>
                <Module
                  disabled={hasIssuedCertificate}
                  module={module}
                  completedCompetencies={completedCompetencyIds}
                  competenciesProgress={competencyProgressMap}
                  cohortAllocationId={allocation.id}
                />

                {index < curriculum.modules.length - 1 ? (
                  <Divider soft className="my-2.5" />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </CourseCardProvider>
  );
}

export function CourseCardFallback() {
  return (
    <div>
      <DescriptionList>
        <DescriptionTerm>Programma</DescriptionTerm>
        <DescriptionDetails>
          <span className="inline-block bg-gray-200 rounded w-48 h-4 align-middle animate-pulse" />
        </DescriptionDetails>

        <DescriptionTerm>Vaartuig</DescriptionTerm>
        <DescriptionDetails>
          <span className="inline-block bg-gray-200 rounded w-48 h-4 align-middle animate-pulse" />
        </DescriptionDetails>
      </DescriptionList>

      <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-2 mt-2">
        <span className="inline-block bg-gray-200 rounded w-52 h-9 align-middle animate-pulse" />
        <span className="inline-block bg-gray-200 rounded w-28 h-9 align-middle animate-pulse" />
      </div>

      <div className="mt-6">
        {[1, 2, 3].map((i, index) => (
          <React.Fragment key={`module-fallback-${i}`}>
            <ModuleFallback index={index} />

            {index < 2 ? <Divider soft className="my-2.5" /> : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function CourseCard(props: CourseCardProps) {
  return (
    <Suspense fallback={<CourseCardFallback />}>
      <CourseCardContent {...props} />
    </Suspense>
  );
}
