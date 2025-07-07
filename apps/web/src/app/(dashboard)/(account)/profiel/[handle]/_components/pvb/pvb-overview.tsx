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
import {
  listPvbsForPersonAsBeoordelaar,
  listPvbsForPersonAsKandidaat,
  listPvbsForPersonAsLeercoach,
} from "~/lib/nwd";
import { BeoordelaarTab } from "./beoordelaar-tab";
import { KandidaatTab } from "./kandidaat-tab";
import { LeercoachTab } from "./leercoach-tab";

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

export default function PvbOverviewSection({
  personPromise,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
}) {
  const kandidaatPvbsPromise = personPromise.then((person) =>
    listPvbsForPersonAsKandidaat(person.id),
  );
  const leercoachPvbsPromise = personPromise.then((person) =>
    listPvbsForPersonAsLeercoach(person.id),
  );
  const beoordelaarPvbsPromise = personPromise.then((person) =>
    listPvbsForPersonAsBeoordelaar(person.id),
  );

  return (
    <StackedLayoutCardDisclosure
      defaultOpen
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Proeve van Bekwaamheid (PvB)</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>
            Bekijk de PvB aanvragen waar je een rol in hebt als kandidaat,
            leercoach of beoordelaar.
          </Text>
        </>
      }
    >
      <TabGroup>
        <TabList className="mt-2">
          <Tab className="flex justify-between sm:justify-center items-center gap-2">
            Kandidaat
            <SuspendedBadge
              promise={kandidaatPvbsPromise.then((pvbs) => pvbs.length)}
              color="branding-orange"
            />
          </Tab>
          <Tab className="flex justify-between sm:justify-center items-center gap-2">
            Leercoach
            <SuspendedBadge
              promise={leercoachPvbsPromise.then((pvbs) => pvbs.length)}
              color="branding-light"
            />
          </Tab>
          <Tab className="flex justify-between sm:justify-center items-center gap-2">
            Beoordelaar
            <SuspendedBadge
              promise={beoordelaarPvbsPromise.then((pvbs) => pvbs.length)}
              color="branding-dark"
            />
          </Tab>
        </TabList>
        <TabPanels className="mt-4">
          <TabPanel>
            <KandidaatTab
              personPromise={personPromise}
              kandidaatPvbsPromise={kandidaatPvbsPromise}
            />
          </TabPanel>
          <TabPanel>
            <LeercoachTab
              personPromise={personPromise}
              leercoachPvbsPromise={leercoachPvbsPromise}
            />
          </TabPanel>
          <TabPanel>
            <BeoordelaarTab
              personPromise={personPromise}
              beoordelaarPvbsPromise={beoordelaarPvbsPromise}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </StackedLayoutCardDisclosure>
  );
}
