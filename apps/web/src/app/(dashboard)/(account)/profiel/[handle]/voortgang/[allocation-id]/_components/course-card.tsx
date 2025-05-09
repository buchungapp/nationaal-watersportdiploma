import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import { ModuleFallback } from "~/app/(dashboard)/(management)/locatie/[location]/cohorten/[cohort]/[student-allocation]/_components/student-module";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { TextLink } from "~/app/(dashboard)/_components/text";
import {
  listCompetencyProgressInCohortForStudent,
  listCompletedCompetenciesByStudentCurriculumId,
  retrieveCurriculumById,
  retrieveStudentAllocationWithCurriculumForPerson,
} from "~/lib/nwd";
import { Module } from "./student-module";

async function CourseCardContent(props: {
  params: Promise<{
    "allocation-id": string;
  }>;
}) {
  const params = await props.params;
  const allocation = await retrieveStudentAllocationWithCurriculumForPerson(
    params["allocation-id"],
  );

  if (!allocation) {
    return notFound();
  }

  if (!allocation.studentCurriculum) {
    throw new Error("Allocation has no student curriculum");
  }

  if (allocation.certificate) {
    throw new Error("Certificate already issued");
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
      listCompetencyProgressInCohortForStudent(params["allocation-id"], true),
    ]);

  if (!curriculum) {
    throw new Error("Failed to retrieve curriculum");
  }

  const completedCompetencyIds = completedCompetencies.map(
    (cc) => cc.competencyId,
  );

  const competencyProgressMap = allCompetencyProgress.map((cp) => ({
    id: cp.competencyId,
    progress: Number(cp.progress),
  }));

  return (
    <div>
      <DescriptionList>
        <DescriptionTerm>Programma</DescriptionTerm>
        <DescriptionDetails>
          <TextLink
            href={`/diplomalijn/consument/disciplines/${allocation.studentCurriculum.discipline.handle}/${allocation.studentCurriculum.course.handle}`}
            target="_blank"
          >
            {allocation.studentCurriculum.program.title ??
              `${allocation.studentCurriculum.course.title} ${allocation.studentCurriculum.degree.title}`}
          </TextLink>
        </DescriptionDetails>

        <DescriptionTerm>Vaartuig</DescriptionTerm>
        <DescriptionDetails>
          {allocation.studentCurriculum.gearType.title}
        </DescriptionDetails>
      </DescriptionList>

      <div className="mt-6">
        {curriculum.modules.map((module, index) => {
          return (
            <React.Fragment key={module.id}>
              <Module
                module={module}
                completedCompetencies={completedCompetencyIds}
                competenciesProgress={competencyProgressMap}
              />

              {index < curriculum.modules.length - 1 ? (
                <Divider soft className="my-2.5" />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function CourseCardFallback() {
  return (
    <div>
      <DescriptionList>
        <DescriptionTerm>Programma</DescriptionTerm>
        <DescriptionDetails>
          <span className="inline-block bg-gray-200 rounded w-48 h-4.25 align-middle animate-pulse" />
        </DescriptionDetails>

        <DescriptionTerm>Vaartuig</DescriptionTerm>
        <DescriptionDetails>
          <span className="inline-block bg-gray-200 rounded w-32 h-4.25 align-middle animate-pulse [animation-delay:0.3s]" />
        </DescriptionDetails>
      </DescriptionList>

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

export function CourseCard(props: {
  params: Promise<{
    "allocation-id": string;
  }>;
}) {
  return (
    <Suspense fallback={<CourseCardFallback />}>
      <CourseCardContent params={props.params} />
    </Suspense>
  );
}
