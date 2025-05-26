import { Badge } from "~/app/(dashboard)/_components/badge";
import { gridContainer } from "~/app/(dashboard)/_components/grid-list-v2";
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
import { Certificates } from "./certificates";
import { CohortProgress } from "./cohort-progress";
import { Programs } from "./programs";

export default function ProgressSection(props: {
  params: Promise<{ handle: string }>;
}) {
  return (
    <div className={`${gridContainer} lg:col-span-2 mb-6`}>
      <StackedLayoutCardDisclosure
        defaultOpen
        className="mb-3"
        header={
          <>
            <div className="flex justify-between items-center gap-2">
              <Subheading>Jouw NWD-programma's en NWD-diploma's</Subheading>
              <StackedLayoutCardDisclosureChevron />
            </div>
            <Text>
              Bekijk je diploma's, hoe je ervoor staat met je opleidingen, en
              hoe het gaat met je huidige cursus. Mis je een diploma? Neem dan
              contact op met de{" "}
              <TextLink href="/vaarlocaties" target="_blank">
                vaarlocatie
              </TextLink>{" "}
              waar je de cursus hebt gevolgd.
            </Text>
          </>
        }
      >
        <TabGroup>
          <TabList className="mt-2">
            <Tab className="flex justify-between sm:justify-center items-center gap-2">
              Behaalde diploma's
              <Badge color="zinc">1</Badge>
            </Tab>
            <Tab className="flex justify-between sm:justify-center items-center gap-2">
              Opleidingen
              <Badge color="zinc">1</Badge>
            </Tab>
            <Tab className="flex justify-between sm:justify-center items-center gap-2">
              Lopende cursussen
              <Badge color="zinc">0</Badge>
            </Tab>
          </TabList>
          <TabPanels className="mt-4">
            <TabPanel>
              <Certificates {...props} />
            </TabPanel>
            <TabPanel>
              <Programs {...props} />
            </TabPanel>
            <TabPanel>
              <CohortProgress {...props} />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </StackedLayoutCardDisclosure>
    </div>
  );
}
