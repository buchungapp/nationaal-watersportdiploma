import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "~/app/(dashboard)/_components/tabs";
import { getPvbBeoordelingsCriteria, getPvbToetsdocumenten } from "~/lib/nwd";
import type { retrievePvbAanvraagByHandle } from "~/lib/nwd";
import { AssessmentView } from "./assessment-view";
import { ToetsdocumentenDisplay } from "./toetsdocumenten-display";

type AanvraagType = Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;

export async function ToetsdocumentenCard({
  aanvraag,
  role,
  personId,
}: {
  aanvraag: AanvraagType;
  role: "kandidaat" | "leercoach" | "beoordelaar";
  personId: string;
}) {
  const [toetsdocumentenList, beoordelingsCriteria] = await Promise.all([
    getPvbToetsdocumenten(aanvraag.id),
    getPvbBeoordelingsCriteria(aanvraag.id),
  ]);

  // Only beoordelaar in "in_beoordeling" status can assess
  const canAssess = role === "beoordelaar" && aanvraag.status === "in_beoordeling";

  // If only one kwalificatieprofiel, show it directly
  if (toetsdocumentenList.length === 1) {
    return (
      <div className="space-y-4">
        {canAssess ? (
          <AssessmentView
            toetsdocumenten={toetsdocumentenList[0]}
            aanvraag={aanvraag}
            beoordelingsCriteria={beoordelingsCriteria.items}
            personId={personId}
          />
        ) : (
          <ToetsdocumentenDisplay
            toetsdocumenten={toetsdocumentenList[0]}
            aanvraag={aanvraag}
            beoordelingsCriteria={beoordelingsCriteria.items}
          />
        )}
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
          {toetsdocumentenList.map((item) => (
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
              {canAssess ? (
                <AssessmentView
                  toetsdocumenten={item}
                  aanvraag={aanvraag}
                  beoordelingsCriteria={beoordelingsCriteria.items}
                  personId={personId}
                />
              ) : (
                <ToetsdocumentenDisplay
                  toetsdocumenten={item}
                  aanvraag={aanvraag}
                  beoordelingsCriteria={beoordelingsCriteria.items}
                />
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}