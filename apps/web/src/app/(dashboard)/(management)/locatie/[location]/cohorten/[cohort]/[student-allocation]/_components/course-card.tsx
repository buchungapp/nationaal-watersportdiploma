import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import React from "react";
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
  retrieveCurriculumById,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import { StartStudentCurriculum } from "./start-curriculum";
import {
  CompleteAllCoreModules,
  CourseCardProvider,
  CourseCardViewSettings,
  Module,
} from "./student-module";

export async function CourseCard({
  cohortAllocationId,
  cohortId,
}: {
  cohortAllocationId: string;
  cohortId: string;
}) {
  const allocation = await retrieveStudentAllocationWithCurriculum(
    cohortId,
    cohortAllocationId,
  );

  if (!allocation) {
    return notFound();
  }

  if (!allocation.studentCurriculum) {
    return (
      <StartStudentCurriculum
        allocationId={cohortAllocationId}
        cohortId={cohortId}
        personId={allocation.person.id}
      />
    );
  }

  const [curriculum, completedCompetencies, allCompetencyProgress] =
    await Promise.all([
      retrieveCurriculumById(allocation.studentCurriculum.curriculumId),
      listCompletedCompetenciesByStudentCurriculumId(
        allocation.studentCurriculum.id,
      ),
      listCompetencyProgressInCohortForStudent(cohortAllocationId),
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
              className="flex gap-1 items-center"
            >
              {allocation.studentCurriculum.program.title ??
                `${allocation.studentCurriculum.course.title} ${allocation.studentCurriculum.degree.title}`}
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
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

        <div className="flex flex-wrap items-center justify-between mt-2 gap-x-2 gap-y-2">
          <CompleteAllCoreModules
            disabled={hasIssuedCertificate}
            cohortAllocationId={cohortAllocationId}
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
          <div className="rounded-md bg-blue-50 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="h-5 w-5 text-blue-400"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
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
                  cohortAllocationId={cohortAllocationId}
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
