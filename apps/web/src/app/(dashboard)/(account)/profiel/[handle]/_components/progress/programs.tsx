import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { User } from "@nawadi/core";
import { Suspense } from "react";
import { MedailIcon } from "~/app/(dashboard)/_components/icons/medail-icon";
import { Strong, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listProgramProgressesByPersonId } from "~/lib/nwd";
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

type ProgramsProps = {
  personPromise: Promise<User.Person.$schema.Person>;
};

export async function fetchPrograms(personId: string) {
  // Currently also includes a program with no progress when the student has started a program in a cohort
  // I think this is fine
  // @TODO: remove this comment when reviewing
  return listProgramProgressesByPersonId(personId).then(
    deduplicateCurriculumCompetencies,
  );
}

function deduplicateCurriculumCompetencies(
  programs: Awaited<ReturnType<typeof listProgramProgressesByPersonId>>,
) {
  return programs.map((program) => {
    // biome-ignore lint/style/noNonNullAssertion: There is always at least one module
    const currentCurriculum = program.modules.sort((a, b) =>
      dayjs(a.curriculum.startedAt).isAfter(dayjs(b.curriculum.startedAt))
        ? 1
        : -1,
    )[0]!.curriculum;

    const sortedCertificates = program.modules
      .flatMap((module) => module.competencies)
      .sort((a, b) =>
        dayjs(a.completed?.createdAt).isAfter(dayjs(b.completed?.createdAt))
          ? 1
          : -1,
      )
      .map((competency) => competency.completed?.certificate)
      .filter((certificate) => certificate !== undefined)
      .filter(
        (certificate, index, self) =>
          self.findIndex((t) => t.id === certificate.id) === index,
      );

    return {
      ...program,
      certificates: sortedCertificates,
      modules: program.modules
        .reduce(
          (acc, module) => {
            const currentModuleIndex = acc.findIndex(
              (m) => m.module.id === module.module.id,
            );

            if (module.curriculum.id !== currentCurriculum.id) {
              if (currentModuleIndex !== -1) {
                acc.splice(currentModuleIndex, 1);
              }

              if (
                module.competencies.some((competency) => competency.completed)
              ) {
                acc.push(module);
              }
            } else if (currentModuleIndex === -1) {
              acc.push(module);
            }

            return acc;
          },
          [] as typeof program.modules,
        )
        .map((module) => {
          const lastCompletedCompetency = dayjs
            .max(
              module.competencies
                .filter(
                  (
                    x,
                  ): x is (typeof module.competencies)[number] & {
                    completed: NonNullable<typeof x.completed>;
                  } => !!x.completed,
                )
                .map(({ completed }) => dayjs(completed.createdAt)),
            )
            ?.toISOString();

          return {
            ...module,
            completedAt: lastCompletedCompetency,
          };
        }),
    };
  });
}

async function Programs({
  programs,
}: {
  programs: Awaited<ReturnType<typeof fetchPrograms>>;
}) {
  return (
    <ul className="space-y-2">
      {programs.map((program, index) => {
        const firstCompletedCertificate = program.certificates[0];
        const mostRecentCompletedCertificate =
          program.certificates[program.certificates.length - 1];

        return (
          <li key={`${program.program.id}-${program.gearType.id}`}>
            <ProgressCard type="program">
              <ProgressCardHeader
                degree={program.degree.title}
                program={program.program.title}
                gearType={program.gearType.title}
                itemIndex={index}
              />

              <ProgressCardDisclosures>
                <ProgressCardDisclosure header="Details">
                  <ProgressCardDescriptionList>
                    <ProgressCardDescriptionListItem
                      label="Eerst behaalde diploma"
                      className="col-span-full sm:col-span-3"
                    >
                      {firstCompletedCertificate
                        ? dayjs(firstCompletedCertificate.issuedAt).format(
                            "DD-MM-YYYY",
                          )
                        : "-"}
                    </ProgressCardDescriptionListItem>
                    <ProgressCardDescriptionListItem
                      label="Meest recente diploma"
                      className="col-span-full sm:col-span-3"
                    >
                      {mostRecentCompletedCertificate
                        ? dayjs(mostRecentCompletedCertificate.issuedAt).format(
                            "DD-MM-YYYY",
                          )
                        : "-"}
                    </ProgressCardDescriptionListItem>
                  </ProgressCardDescriptionList>
                </ProgressCardDisclosure>

                <ProgressCardDisclosure
                  header={
                    <>
                      Opleidingsprogramma{" "}
                      <ProgressCardBadge>
                        {program.modules.filter((m) => m.completedAt).length}
                      </ProgressCardBadge>
                    </>
                  }
                >
                  <ProgressCardStatusList>
                    {program.modules.map((m) => (
                      <ProgressCardStatus
                        key={m.module.id}
                        title={m.module.title}
                        progress={m.completedAt ? 100 : 0}
                        updatedAt={m.completedAt}
                      >
                        <ProgressCardStatusSubList>
                          {m.competencies.map((c) => (
                            <ProgressCardStatus
                              key={c.id}
                              title={c.title}
                              subtitle={c.requirement}
                              progress={c.completed ? 100 : 0}
                              updatedAt={c.completed?.createdAt}
                            />
                          ))}
                        </ProgressCardStatusSubList>
                      </ProgressCardStatus>
                    ))}
                  </ProgressCardStatusList>
                </ProgressCardDisclosure>
                <ProgressCardDisclosure
                  disabled={program.certificates.length === 0}
                  header={
                    <>
                      Behaalde diploma's{" "}
                      <ProgressCardBadge>
                        {program.certificates.length}
                      </ProgressCardBadge>
                    </>
                  }
                >
                  <ProgressCardStatusList>
                    {program.certificates.map((certificate) => (
                      <ProgressCardStatus
                        key={certificate.id}
                        title={
                          <TextLink
                            target="_blank"
                            href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
                            className="flex items-center gap-1"
                          >
                            <Strong>{certificate.handle}</Strong>
                            <ArrowTopRightOnSquareIcon className="size-4" />
                          </TextLink>
                        }
                        progress={100}
                        updatedAt={certificate.issuedAt}
                        icon={
                          <MedailIcon className="size-5 text-branding-orange" />
                        }
                      />
                    ))}
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

async function ProgramsContent(props: ProgramsProps) {
  const person = await props.personPromise;
  const programs = await fetchPrograms(person.id);

  if (programs.length < 1) {
    return "Geen opleidingen gevonden";
  }

  return <Programs programs={programs} />;
}

function ProgramsFallback() {
  return (
    <ul className="space-y-2">
      <li className="bg-gray-200 rounded w-full h-81.75 animate-pulse" />
    </ul>
  );
}

export function ProgramsWithSuspense(props: ProgramsProps) {
  return (
    <Suspense fallback={<ProgramsFallback />}>
      <ProgramsContent {...props} />
    </Suspense>
  );
}
