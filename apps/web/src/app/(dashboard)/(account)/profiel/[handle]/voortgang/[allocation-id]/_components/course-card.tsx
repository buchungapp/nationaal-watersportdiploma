import { PlusIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Strong, TextLink } from "~/app/(dashboard)/_components/text";
import { Weight } from "~/app/_components/weight";
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
          <span className="inline-block bg-zinc-200 rounded w-48 h-4.25 align-middle animate-pulse" />
        </DescriptionDetails>

        <DescriptionTerm>Vaartuig</DescriptionTerm>
        <DescriptionDetails>
          <span className="inline-block bg-zinc-200 rounded w-32 h-4.25 align-middle animate-pulse [animation-delay:0.3s]" />
        </DescriptionDetails>
      </DescriptionList>

      <div className="mt-6">
        {[1, 2, 3].map((i, index) => (
          <React.Fragment key={`module-fallback-${i}`}>
            {/* biome-ignore lint/a11y/useSemanticElements: <explanation> */}
            <CheckboxGroup role="group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-x-2">
                  <Button plain>
                    <PlusIcon />
                  </Button>

                  <CheckboxField disabled={true}>
                    <Checkbox />
                    <div className="flex gap-x-2">
                      <Weight weight={1} />
                      <Label>
                        <Strong>
                          <span
                            className="inline-block bg-gray-300 rounded w-24 h-4.25 align-middle animate-pulse"
                            style={{ animationDelay: `${index * 0.3}s` }}
                          />
                        </Strong>
                      </Label>
                    </div>
                  </CheckboxField>
                </div>
                <div className="flex justify-end items-center gap-x-2">
                  <span
                    className="inline-flex bg-gray-200 rounded-md w-9.5 h-6 animate-pulse"
                    style={{ animationDelay: `${index * 0.3 + 0.1}s` }}
                  />
                </div>
              </div>
            </CheckboxGroup>

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
