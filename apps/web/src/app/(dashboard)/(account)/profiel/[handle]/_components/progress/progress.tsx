import type { User } from "@nawadi/core";
import { clsx } from "clsx";
import { type ComponentProps, Suspense } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "~/app/(dashboard)/_components/tabs";
import { Text } from "~/app/(dashboard)/_components/text";
import { listCurriculaByPersonId } from "~/lib/nwd";
import { CertificatesWithSuspense, fetchCertificates } from "./certificates";
import {
  CohortProgressWithSuspense,
  fetchCohortProgress,
} from "./cohort-progress";
import { ProgramsWithSuspense, fetchCurriculaProgress } from "./programs";

type BadgeColor = "branding-orange" | "branding-light" | "branding-dark";

const colorClassMap: Record<BadgeColor, string> = {
  "branding-orange":
    "group-data-selected/tab:bg-branding-orange/15 group-data-selected/tab:text-branding-orange",
  "branding-light":
    "group-data-selected/tab:bg-branding-light/15 group-data-selected/tab:text-branding-light",
  "branding-dark":
    "group-data-selected/tab:bg-branding-dark/15 group-data-selected/tab:text-branding-dark",
};

async function BadgeContent({
  promise,
  color,
}: {
  promise: Promise<React.ReactNode>;
  color: BadgeColor;
}) {
  const content = await promise;
  return (
    <span
      className={clsx(
        "-my-1",
        "inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-sm/5 font-medium sm:text-xs/5 forced-colors:outline",
        colorClassMap[color],
      )}
    >
      {content}
    </span>
  );
}

function SuspendedBadge({
  promise,
  color,
}: {
  promise: Promise<React.ReactNode>;
  color: BadgeColor;
}) {
  return (
    <Suspense
      fallback={<Badge className="-my-1 w-5 h-6 align-middle animate-pulse" />}
    >
      <BadgeContent promise={promise} color={color} />
    </Suspense>
  );
}

export default function ProgressSection({
  personPromise,
  description,

  certificateActionButton,
  programActionButton,
  cohortProgressActionButton,

  certificateEmptyState,
  programEmptyState,
  cohortProgressEmptyState,

  programOptions,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
  description: React.ReactNode;

  certificateActionButton?: React.ReactNode;
  programActionButton?: React.ReactNode;
  cohortProgressActionButton?: React.ReactNode;

  certificateEmptyState?: React.ReactNode;
  programEmptyState?: React.ReactNode;
  cohortProgressEmptyState?: React.ReactNode;

  programOptions?: ComponentProps<typeof ProgramsWithSuspense>["options"];
}) {
  const curriculaPromise = personPromise.then((person) =>
    listCurriculaByPersonId(person.id, false),
  );
  const certificatesPromise = personPromise.then((person) =>
    fetchCertificates(person.id),
  );
  const programsPromise = personPromise.then((person) =>
    fetchCurriculaProgress(person.id),
  );
  const allocationsPromise = personPromise.then((person) =>
    fetchCohortProgress(person.id),
  );

  return (
    <StackedLayoutCardDisclosure
      defaultOpen
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Nationaal Watersportdiploma</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>{description}</Text>
        </>
      }
    >
      <TabGroup>
        <TabList className="mt-2">
          <Tab className="flex justify-between sm:justify-center items-center gap-2">
            Behaalde diploma's
            <SuspendedBadge
              promise={certificatesPromise.then(
                (certificates) => certificates.length,
              )}
              color="branding-orange"
            />
          </Tab>
          <Tab className="flex justify-between sm:justify-center items-center gap-2">
            Opleidingen
            <SuspendedBadge
              promise={programsPromise.then((programs) => {
                const programsWithProgress =
                  programOptions?.showProgramsWithoutProgress
                    ? programs
                    : programs.filter(
                        (program) => program.certificates.length > 0,
                      );
                return programsWithProgress.length;
              })}
              color="branding-light"
            />
          </Tab>
          <Tab className="flex justify-between sm:justify-center items-center gap-2">
            Lopende cursussen
            <SuspendedBadge
              promise={allocationsPromise.then(
                (allocations) => allocations.length,
              )}
              color="branding-dark"
            />
          </Tab>
        </TabList>
        <TabPanels className="mt-4">
          <TabPanel>
            <CertificatesWithSuspense
              personPromise={personPromise}
              actionButton={certificateActionButton}
              emptyState={certificateEmptyState}
            />
          </TabPanel>
          <TabPanel>
            <ProgramsWithSuspense
              personPromise={personPromise}
              curriculaPromise={curriculaPromise}
              actionButton={programActionButton}
              emptyState={programEmptyState}
              options={programOptions}
            />
          </TabPanel>
          <TabPanel>
            <CohortProgressWithSuspense
              personPromise={personPromise}
              curriculaPromise={curriculaPromise}
              actionButton={cohortProgressActionButton}
              emptyState={cohortProgressEmptyState}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </StackedLayoutCardDisclosure>
  );
}
