import type { User } from "@nawadi/core";
import { clsx } from "clsx";
import { Suspense } from "react";
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
import { CertificatesWithSuspense, fetchCertificates } from "./certificates";
import { fetchCohortProgress } from "./cohort-progress";
import { ProgramsWithSuspense, fetchPrograms } from "./programs";

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
}: {
  personPromise: Promise<User.Person.$schema.Person>;
}) {
  const certificatesPromise = personPromise.then((person) =>
    fetchCertificates(person.id),
  );
  const programsPromise = personPromise.then((person) =>
    fetchPrograms(person.id),
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
          <Text>
            Bekijk je diploma's, hoe je ervoor staat met je opleidingen, en hoe
            het gaat met je huidige cursus.
          </Text>
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
              promise={programsPromise.then((programs) => programs.length)}
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
            {/* <Text className="-mt-2 mb-2">
              Mis je een diploma? Neem dan contact op met de{" "}
              <TextLink href="/vaarlocaties" target="_blank">
                vaarlocatie
              </TextLink>{" "}
              waar je de cursus hebt gevolgd.
            </Text> */}
            <CertificatesWithSuspense personPromise={personPromise} />
          </TabPanel>
          <TabPanel>
            <ProgramsWithSuspense personPromise={personPromise} />
          </TabPanel>
          <TabPanel>
            {/* <CohortProgress allocations={allocations} /> */}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </StackedLayoutCardDisclosure>
  );
}
