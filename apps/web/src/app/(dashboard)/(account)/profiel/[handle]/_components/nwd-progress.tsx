import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  GridList,
  GridListItem,
  GridListItemDisclosure,
  GridListItemFooter,
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

async function NWDProgramsContent({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);
  const programs = await listProgramProgressesByPersonId(person.id);

  console.log(programs);

  return (
    <GridList>
      <GridListItem className="col-span-2 bg-white">
        <GridListItemHeader>
          <GridListItemTitle>Jeugdzeilen Zwaardboot 1-mans</GridListItemTitle>
          <div className="flex gap-1">
            <Badge color="orange">Basis</Badge>
            <Text>
              <AnchorIcon className="inline mr-1 size-3" />
              Optimist
            </Text>
          </div>
        </GridListItemHeader>
        <Text className="-mt-3 mb-3 px-6">5 van 8 modules voltooid</Text>
        <GridListItemDisclosure title="Modules" panelClassName="px-6 pb-4">
          <ul className="text-sm">
            <li className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-green-500" />
                <span className="font-semibold">Veiligheid aan boord</span>
              </div>
              <Badge color="green">Voltooid op 22-03-2024</Badge>
            </li>
            <Divider />
            <li className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-green-500" />
                <span className="font-semibold">Zeilklaar maken</span>
              </div>
              <Badge color="green">Voltooid op 05-04-2024</Badge>
            </li>
            <Divider />
            <li className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-green-500" />
                <span className="font-semibold">
                  Sturen, schoten en overstag
                </span>
              </div>
              <Badge color="green">Voltooid op 19-04-2024</Badge>
            </li>
            <Divider />
            <li className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <CircleIcon className="size-5 text-gray-500" />
                <span className="text-gray-500">Opkruisen</span>
              </div>
              <Badge color="zinc">Nog te voltooien</Badge>
            </li>
            <Divider />
            <li className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <CircleIcon className="size-5 text-gray-500" />
                <span className="text-gray-500">Gijpen</span>
              </div>
              <Badge color="zinc">Nog te voltooien</Badge>
            </li>
            <Divider />
            <li className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-green-500" />
                <span className="font-semibold">Aanleggen</span>
              </div>
              <Badge color="green">Voltooid op 03-05-2024</Badge>
            </li>
            <Divider />
            <li className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <CircleIcon className="size-5 text-gray-500" />
                <span className="text-gray-500">Man overboord</span>
              </div>
              <Badge color="zinc">Nog te voltooien</Badge>
            </li>
            <Divider />
            <li className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-green-500" />
                <span className="font-semibold">Theorie</span>
              </div>
              <Badge color="green">Voltooid op 10-05-2024</Badge>
            </li>
          </ul>
        </GridListItemDisclosure>
        <GridListItemFooter>
          <Text>Voltooi modules op basis van je eigen ontwikkeling</Text>
          <Button color="white">
            Details bekijken <ChevronRightIcon className="size-4" />
          </Button>
        </GridListItemFooter>
      </GridListItem>
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
