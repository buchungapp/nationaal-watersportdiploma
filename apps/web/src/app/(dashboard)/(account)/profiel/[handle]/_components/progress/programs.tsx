import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";
import { MedailIcon } from "~/app/(dashboard)/_components/icons/medail-icon";
import { Strong, Text, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { getPersonByHandle, listProgramProgressesByPersonId } from "~/lib/nwd";
import {
  ColoredText,
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
  ProgressCardTypeBadge,
} from "./progress-card";

type ProgramsProps = {
  params: Promise<{ handle: string }>;
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

export async function Programs({
  programs,
}: {
  programs: Awaited<ReturnType<typeof fetchPrograms>>;
}) {
  if (programs.length === 0) {
    return (
      <Text className="-mt-2 mb-2">
        We hebben geen opleiding voor je gevonden.
      </Text>
    );
  }

  return (
    <ul className="space-y-2">
      {programs.map((program, index) => {
        const firstCompletedCertificate = program.certificates[0];
        const mostRecentCompletedCertificate =
          program.certificates[program.certificates.length - 1];

        return (
          <li key={`${program.program.id}-${program.gearType.id}`}>
            <ProgressCard type="opleiding">
              <ProgressCardHeader>
                <ProgressCardTypeBadge />
                <ProgressCardTitle>
                  {program.program.title}
                  <ColoredText>{program.gearType.title}</ColoredText>
                </ProgressCardTitle>
                <ProgressCardDegree>{program.degree.title}</ProgressCardDegree>
              </ProgressCardHeader>

              <ProgressCardDescriptionList>
                <ProgressCardDescriptionListItem label="Eerst behaalde diploma">
                  {firstCompletedCertificate
                    ? dayjs(firstCompletedCertificate.issuedAt).format(
                        "DD-MM-YYYY",
                      )
                    : "-"}
                </ProgressCardDescriptionListItem>
                <ProgressCardDescriptionListItem label="Meest recente diploma">
                  {mostRecentCompletedCertificate
                    ? dayjs(mostRecentCompletedCertificate.issuedAt).format(
                        "DD-MM-YYYY",
                      )
                    : "-"}
                </ProgressCardDescriptionListItem>
              </ProgressCardDescriptionList>

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
                  {program.modules.map((m, index) => (
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
                  {program.certificates.map((certificate, index) => (
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

export async function ProgramsContent(props: ProgramsProps) {
  const { handle } = await props.params;
  const person = await getPersonByHandle(handle);
  const programs = await fetchPrograms(person.id);
  return <Programs programs={programs} />;
}

export function ProgramsFallback() {
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
