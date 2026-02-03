import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import { Weight } from "~/app/_components/weight";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  CompetencyTypeBadge,
  ModuleRequiredBadge,
} from "~/app/(dashboard)/_components/badges";
import Disclosure from "~/app/(dashboard)/_components/disclosure";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import CopyToClipboard from "~/app/(public)/_components/copy-to-clipboard-simple";
import dayjs from "~/lib/dayjs";
import {
  countStartedStudentsForCurriculum,
  listCurriculaByProgram,
  listGearTypesByCurriculum,
  listPrograms,
} from "~/lib/nwd";
import { CopyCurriculum } from "../../../_components/action-buttons";

type ProgramCurriculaProps = {
  params: Promise<{ handle: string }>;
};

type Curriculum = Awaited<ReturnType<typeof listCurriculaByProgram>>[number];

async function CurriculumContent({
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
      <div className="gap-x-12 grid grid-cols-1 lg:grid-cols-3">
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
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-x-2">
                      <div className="w-12 shrink-0">
                        <Weight weight={module.weight} />
                      </div>
                      <Heading level={3}>
                        <CopyToClipboard copyValue={module.id}>
                          {module.title}
                        </CopyToClipboard>
                      </Heading>
                    </div>
                    <div className="flex justify-end items-center gap-x-2">
                      <ModuleRequiredBadge
                        type={module.isRequired ? "required" : "not-required"}
                      />
                      <CompetencyTypeBadge type={module.type} />
                    </div>
                  </div>

                  <dl className="space-y-1 mt-2">
                    {module.competencies.map((competency) => (
                      <div key={competency.id} className="flex gap-x-2">
                        <div className="w-12 shrink-0">
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

async function ProgramCurriculaContent({ params }: ProgramCurriculaProps) {
  const { handle } = await params;
  const program = await listPrograms().then((programs) =>
    programs.find((program) => program.handle === handle),
  );

  if (!program) {
    return notFound();
  }

  const [curricula] = await Promise.all([
    listCurriculaByProgram(program.id, false),
  ]);

  const currentCurriculum = curricula
    .sort((a, b) => {
      if (!a.startedAt) return -1;
      if (!b.startedAt) return 1;
      return b.startedAt.localeCompare(a.startedAt);
    })
    .find((curriculum) => curriculum.startedAt);

  return (
    <div className="mt-6">
      {curricula.map((curriculum) => (
        <CurriculumContent
          key={curriculum.id}
          curriculum={curriculum}
          isCurrent={currentCurriculum?.id === curriculum.id}
        />
      ))}
    </div>
  );
}

export function ProgramCurriculaFallback() {
  return (
    <div className="mt-6">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex justify-start items-start hover:bg-slate-100 p-4 w-full text-left"
        >
          <div className="flex justify-center items-center mr-6 h-6">
            <ChevronRightIcon className="w-3.5 h-3.5 ui-open:rotate-90 transition-transform shrink-0" />
          </div>
          <span className="font-semibold leading-6">
            <div className="flex items-center">
              <span className="inline-block bg-gray-200 rounded w-24 h-6 align-middle" />
              <span className="inline-block bg-gray-200 ml-2.5 rounded-lg w-11.5 h-6.5 align-middle" />
            </div>
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProgramCurricula({ params }: ProgramCurriculaProps) {
  return (
    <Suspense fallback={<ProgramCurriculaFallback />}>
      <ProgramCurriculaContent params={params} />
    </Suspense>
  );
}
