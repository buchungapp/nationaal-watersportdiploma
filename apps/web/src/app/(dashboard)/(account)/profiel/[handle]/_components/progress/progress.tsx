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
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { getPersonByHandle } from "~/lib/nwd";
import {
  Certificates,
  CertificatesFallback,
  fetchCertificates,
} from "./certificates";
import {
  CohortProgress,
  CohortProgressFallback,
  fetchCohortProgress,
} from "./cohort-progress";
import { Programs, ProgramsFallback, fetchPrograms } from "./programs";

async function ProgressTabs(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const person = await getPersonByHandle(handle);
  const certificates = await fetchCertificates(person.id);
  const programs = await fetchPrograms(person.id);
  const allocations = await fetchCohortProgress(person.id);

  return (
    <TabGroup>
      <TabList className="mt-2">
        <Tab className="flex justify-between sm:justify-center items-center gap-2">
          Behaalde diploma's
          <Badge color="branding-orange" className="-my-1">
            {certificates.length}
          </Badge>
        </Tab>
        <Tab className="flex justify-between sm:justify-center items-center gap-2">
          Opleidingen
          <Badge color="branding-light" className="-my-1">
            {programs.length}
          </Badge>
        </Tab>
        <Tab className="flex justify-between sm:justify-center items-center gap-2">
          Lopende cursussen
          <Badge color="branding-dark" className="-my-1">
            {allocations.length}
          </Badge>
        </Tab>
      </TabList>
      <TabPanels className="mt-4">
        <TabPanel>
          <Certificates certificates={certificates} />
        </TabPanel>
        <TabPanel>
          <Programs programs={programs} />
        </TabPanel>
        <TabPanel>
          <CohortProgress allocations={allocations} />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}

export default function ProgressSection(props: {
  params: Promise<{ handle: string }>;
}) {
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
            het gaat met je huidige cursus. Mis je een diploma? Neem dan contact
            op met de{" "}
            <TextLink href="/vaarlocaties" target="_blank">
              vaarlocatie
            </TextLink>{" "}
            waar je de cursus hebt gevolgd.
          </Text>
        </>
      }
    >
      <Suspense
        fallback={
          <TabGroup>
            <TabList className="mt-2">
              <Tab className="flex justify-between sm:justify-center items-center gap-2">
                Behaalde diploma's
                <Badge className="-my-1 w-5 h-6 align-middle animate-pulse" />
              </Tab>
              <Tab className="flex justify-between sm:justify-center items-center gap-2">
                Opleidingen
                <Badge className="-my-1 w-5 h-6 align-middle animate-pulse" />
              </Tab>
              <Tab className="flex justify-between sm:justify-center items-center gap-2">
                Lopende cursussen
                <Badge className="-my-1 w-5 h-6 align-middle animate-pulse" />
              </Tab>
            </TabList>
            <TabPanels className="mt-4">
              <TabPanel>
                <CertificatesFallback />
              </TabPanel>
              <TabPanel>
                <ProgramsFallback />
              </TabPanel>
              <TabPanel>
                <CohortProgressFallback />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        }
      >
        <ProgressTabs params={props.params} />
      </Suspense>
    </StackedLayoutCardDisclosure>
  );
}
