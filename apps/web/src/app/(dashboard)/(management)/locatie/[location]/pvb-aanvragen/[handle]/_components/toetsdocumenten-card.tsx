import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "~/app/(dashboard)/_components/tabs";
import { getPvbBeoordelingsCriteria, getPvbToetsdocumenten } from "~/lib/nwd";
import { ToetsdocumentenDisplay } from "./toetsdocumenten-display";

interface Course {
  id: string;
  title: string | null;
  code: string | null;
  isMainCourse: boolean;
}

export async function ToetsdocumentenCard({
  params,
  aanvraag,
}: {
  params: Promise<{ location: string; handle: string }>;
  aanvraag: {
    id: string;
    status: string;
    courses: Course[];
    onderdelen: Array<{
      id: string;
      kerntaakOnderdeelId: string;
      startDatumTijd: string | null;
      uitslag: "behaald" | "niet_behaald" | "nog_niet_bekend";
      opmerkingen: string | null;
      beoordelaar: {
        id: string;
        firstName: string | null;
        lastNamePrefix: string | null;
        lastName: string | null;
      } | null;
    }>;
  };
}) {
  const resolvedParams = await params;
  const [toetsdocumentenList, beoordelingsCriteria] = await Promise.all([
    getPvbToetsdocumenten(aanvraag.id),
    getPvbBeoordelingsCriteria(aanvraag.id),
  ]);

  // If only one kwalificatieprofiel, show it directly
  if (toetsdocumentenList.length === 1) {
    return (
      <div className="space-y-4">
        <ToetsdocumentenDisplay
          toetsdocumenten={toetsdocumentenList[0]}
          aanvraag={aanvraag}
          params={resolvedParams}
          beoordelingsCriteria={beoordelingsCriteria.items}
        />
      </div>
    );
  }

  // Multiple kwalificatieprofielen - show in tabs
  return (
    <div className="space-y-4">
      <TabGroup defaultIndex={0}>
        <TabList
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${toetsdocumentenList.length}, 1fr)`,
          }}
        >
          {toetsdocumentenList.map((item, index) => (
            <Tab key={`tab-${item.kwalificatieprofiel.id}`}>
              <div className="text-center">
                <div className="font-medium">
                  {item.kwalificatieprofiel.titel}
                </div>
              </div>
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {toetsdocumentenList.map((item) => (
            <TabPanel
              key={`panel-${item.kwalificatieprofiel.id}`}
              className="mt-4"
            >
              <ToetsdocumentenDisplay
                toetsdocumenten={item}
                aanvraag={aanvraag}
                params={resolvedParams}
                beoordelingsCriteria={beoordelingsCriteria.items}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}
