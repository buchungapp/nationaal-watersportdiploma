import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  type DEGREE_COLORS,
  DegreeBadge,
} from "~/app/(dashboard)/_components/badges";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  GridList,
  GridListItem,
  GridListItemDisclosure,
  GridListItemHeader,
  GridListItemTitle,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { AnchorIcon } from "~/app/(dashboard)/_components/icons/anchor-icon";
import { CircleIcon } from "~/app/(dashboard)/_components/icons/circle-icon";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "~/app/(dashboard)/_components/tabs";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { getPersonByHandle, listProgramProgressesByPersonId } from "~/lib/nwd";
import { NWDCertificates } from "./certificates";

async function NWDCertificatesContent({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);

  return (
    <Suspense
      fallback={
        <GridList>
          <li className="bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse" />
          <li className="hidden sm:block bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse [animation-delay:300ms]" />
        </GridList>
      }
    >
      <NWDCertificates
        personId={person.id}
        noResults={
          <Text className="mb-2 italic">
            Je hebt nog geen NWD-diploma's behaald. Klopt dit niet? Neem dan
            contact op met de{" "}
            <TextLink href="/vaarlocaties" target="_blank">
              vaarlocatie
            </TextLink>{" "}
            waar je de cursus hebt gevolgd.
          </Text>
        }
      />
    </Suspense>
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

    return {
      ...program,
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
          const lastCompletedCompetency = module.competencies.sort((a, b) =>
            dayjs(a.completed?.createdAt).isAfter(dayjs(b.completed?.createdAt))
              ? 1
              : -1,
          )[0]?.completed?.createdAt;

          return {
            ...module,
            completedAt: lastCompletedCompetency || null,
          };
        }),
    };
  });
}

async function NWDProgramsContent({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);
  const programs = await listProgramProgressesByPersonId(person.id).then(
    deduplicateCurriculumCompetencies,
  );

  return (
    <GridList>
      {programs.map((program) => (
        <GridListItem
          key={`${program.program.id}-${program.gearType.id}`}
          className="col-span-2 bg-white"
        >
          <GridListItemHeader>
            <GridListItemTitle>{program.program.title}</GridListItemTitle>
            <div className="flex gap-2">
              <DegreeBadge
                handle={program.degree.handle as keyof typeof DEGREE_COLORS}
                title={`Niveau ${program.degree.title}`}
              />
              <Text>
                <AnchorIcon className="inline mr-1 size-3" />
                {program.gearType.title}
              </Text>
            </div>
          </GridListItemHeader>
          <Text className="-mt-3 mb-3 px-6">
            {
              program.modules.filter((m) =>
                m.competencies.every((c) => c.completed),
              ).length
            }{" "}
            van {program.modules.length} modules voltooid
          </Text>
          <GridListItemDisclosure title="Modules" panelClassName="px-6">
            <ul className="text-sm">
              {program.modules.map((m, index) => (
                <>
                  <li
                    key={m.module.id}
                    className="flex justify-between items-center py-2"
                  >
                    <div className="flex items-center gap-2">
                      {m.completedAt ? (
                        <CheckCircleIcon className="size-5 text-green-500" />
                      ) : (
                        <CircleIcon className="size-5 text-zinc-500" />
                      )}
                      <span className="font-semibold">{m.module.title}</span>
                    </div>
                    <Badge color={m.completedAt ? "green" : "zinc"}>
                      {m.completedAt
                        ? `Voltooid op ${dayjs(m.completedAt).format("DD-MM-YYYY")}`
                        : "Nog niet voltooid"}
                    </Badge>
                  </li>
                  {index !== program.modules.length - 1 && (
                    <Divider key={`${m.module.id}-divider`} />
                  )}
                </>
              ))}
            </ul>
          </GridListItemDisclosure>
          {/* <GridListItemFooter>
            <Text>Voltooi modules op basis van je eigen ontwikkeling</Text>
            <Button color="white">
              Details bekijken <ChevronRightIcon className="size-4" />
            </Button>
          </GridListItemFooter> */}
        </GridListItem>
      ))}
    </GridList>
  );
}

export default function NWDProgressSection(props: {
  params: Promise<{ handle: string }>;
}) {
  return (
    <div className={`${gridContainer} lg:col-span-2 mb-6`}>
      <TabGroup>
        <StackedLayoutCard className="mb-3">
          <Subheading>Jouw NWD-programma's en NWD-diploma's</Subheading>
          <Text>
            Hieronder vind je een overzicht van de NWD-programma's en
            NWD-diploma's die je hebt behaald. Klik ze aan en leer meer over je
            diploma en vier het succes nog een keer! Mis je een diploma? Neem
            dan contact op met de{" "}
            <TextLink href="/vaarlocaties" target="_blank">
              vaarlocatie
            </TextLink>{" "}
            waar je de cursus hebt gevolgd.
          </Text>
          <TabList className="mt-2">
            <Tab>Diploma's</Tab>
            <Tab>Programma's</Tab>
          </TabList>
        </StackedLayoutCard>
        <TabPanels>
          <TabPanel>
            <Suspense
              fallback={
                <GridList>
                  <li className="bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse" />
                  <li className="hidden sm:block bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse delay-500" />
                </GridList>
              }
            >
              <NWDCertificatesContent {...props} />
            </Suspense>
          </TabPanel>
          <TabPanel>
            <Suspense
              fallback={
                <GridList>
                  <li className="bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse" />
                  <li className="hidden sm:block bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse delay-500" />
                </GridList>
              }
            >
              <NWDProgramsContent {...props} />
            </Suspense>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
