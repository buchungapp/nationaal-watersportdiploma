import { notFound } from "next/navigation";
import React from "react";
import BackButton from "~/app/(dashboard)/(management)/_components/back-button";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  CompetencyTypeBadge,
  ModuleRequiredBadge,
} from "~/app/(dashboard)/_components/badges";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import Disclosure from "~/app/(dashboard)/_components/disclosure";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Code, Strong, Text } from "~/app/(dashboard)/_components/text";
import CopyToClipboard from "~/app/(public)/_components/copy-to-clipboard-simple";
import { Weight } from "~/app/_components/weight";
import dayjs from "~/lib/dayjs";
import {
  countStartedStudentsForCurriculum,
  listCurriculaByProgram,
  listGearTypesByCurriculum,
  listPrograms,
} from "~/lib/nwd";
import { CopyCurriculum } from "../../_components/action-buttons";

type Curriculum = Awaited<ReturnType<typeof listCurriculaByProgram>>[number];

async function Curriculum({
  curriculum,
  isCurrent,
}: {
  curriculum: Curriculum;
  isCurrent: boolean;
}) {
  const [gearTypes, count] = await Promise.all([
    listGearTypesByCurriculum(curriculum.id),
    countStartedStudentsForCurriculum(curriculum.id),
  ]);
  return (
    <Disclosure
      heading={
        <div className="flex items-center">
          {`#${curriculum.revision}`}
          {isCurrent ? (
            <Badge color="green" className="ml-2.5">
              Actief
            </Badge>
          ) : null}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12">
        <div>
          <div>
            <CopyCurriculum curriculumId={curriculum.id} />
          </div>
          <Divider soft className="my-6" />

          {curriculum.startedAt ? (
            <>
              <div className="flex flex-col space-y-1">
                <Subheading level={3}>Actief per</Subheading>
                <Text>
                  {dayjs(curriculum.startedAt).format("DD MMMM YYYY")}
                </Text>
              </div>
              <Divider soft className="my-6" />
              <div className="flex flex-col space-y-1">
                <Subheading level={3}>Gestarte opleidingen</Subheading>
                <Text>{count}</Text>
              </div>
              <Divider soft className="my-6" />
            </>
          ) : null}

          <div className="flex flex-col space-y-1">
            <Subheading level={3}>Boottypen</Subheading>
            <ul className="">
              {gearTypes.map((gearType) => (
                <li key={gearType.id}>
                  <Text>{gearType.title}</Text>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          {curriculum.modules.map((module, index) => {
            return (
              <React.Fragment key={module.id}>
                <div className="">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-x-2">
                      <div className="flex-shrink-0 w-12">
                        <Weight weight={module.weight} />
                      </div>
                      <Heading level={3}>
                        <CopyToClipboard copyValue={module.id}>
                          {module.title}
                        </CopyToClipboard>
                      </Heading>
                    </div>
                    <div className="flex items-center justify-end gap-x-2">
                      <ModuleRequiredBadge
                        type={module.isRequired ? "required" : "not-required"}
                      />
                      <CompetencyTypeBadge type={module.type} />
                    </div>
                  </div>

                  <dl className="mt-2 space-y-1">
                    {module.competencies.map((competency) => (
                      <div key={competency.id} className="flex gap-x-2">
                        <div className="flex-shrink-0 w-12">
                          <Weight weight={competency.weight} />
                        </div>
                        <div>
                          <dt>
                            <Text>
                              <CopyToClipboard copyValue={competency.id}>
                                <Strong>{competency.title}</Strong>
                              </CopyToClipboard>
                            </Text>
                          </dt>
                          <dd>
                            <Text>{competency.requirement}</Text>
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>

                {index < curriculum.modules.length - 1 ? (
                  <Divider soft className="my-6" />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Disclosure>
  );
}

export default async function Page(props: {
  params: Promise<{
    handle: string;
  }>;
}) {
  const params = await props.params;
  const program = await listPrograms().then((programs) =>
    programs.find((program) => program.handle === params.handle),
  );

  if (!program) {
    notFound();
  }

  const [curricula] = await Promise.all([
    listCurriculaByProgram(program.id, false),
  ]);

  const currentCurriculum =
    //   Most recent startedAt
    curricula
      .sort((a, b) => {
        // Without startedAt, should be on top
        if (!a.startedAt) return -1;
        if (!b.startedAt) return 1;
        return b.startedAt.localeCompare(a.startedAt);
      })
      .find((curriculum) => curriculum.startedAt);

  return (
    <>
      <BackButton
        href={`/secretariaat/diplomalijn/cursussen/${program.course.handle}`}
      >
        Cursus
      </BackButton>
      <Heading>
        {program.title ?? `${program.course.title} ${program.degree.title}`}
      </Heading>

      <DescriptionList className="mt-10">
        <DescriptionTerm>Handle</DescriptionTerm>
        <DescriptionDetails>
          <Code>{program.handle}</Code>
        </DescriptionDetails>

        <DescriptionTerm>Programma</DescriptionTerm>
        <DescriptionDetails>{program.course.title}</DescriptionDetails>

        <DescriptionTerm>Niveau</DescriptionTerm>
        <DescriptionDetails>{program.degree.title}</DescriptionDetails>
      </DescriptionList>

      <Divider className="my-10" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading level={2}>Curricula</Heading>
      </div>

      <div className="mt-6">
        {curricula.map((curriculum) => (
          <Curriculum
            key={curriculum.id}
            curriculum={curriculum}
            isCurrent={currentCurriculum?.id === curriculum.id}
          />
        ))}
      </div>
    </>
  );
}
