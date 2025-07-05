"use client";

import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "~/app/(dashboard)/_components/tabs";
import type {
  getPvbBeoordelingsCriteria,
  getPvbToetsdocumenten,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";
import { AssessmentView } from "./assessment-view";
import { ToetsdocumentenDisplay } from "./toetsdocumenten-display";

type AanvraagType = Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;

interface ToetsdocumentenClientProps {
  toetsdocumentenList: Awaited<ReturnType<typeof getPvbToetsdocumenten>>;
  aanvraag: AanvraagType;
  beoordelingsCriteria: Awaited<
    ReturnType<typeof getPvbBeoordelingsCriteria>
  >["items"];
  role: "kandidaat" | "leercoach" | "beoordelaar";
  personId: string;
}

export function ToetsdocumentenClient({
  toetsdocumentenList,
  aanvraag,
  beoordelingsCriteria,
  role,
  personId,
}: ToetsdocumentenClientProps) {
  // Only beoordelaar in "in_beoordeling" status can assess
  const canAssess =
    role === "beoordelaar" && aanvraag.status === "in_beoordeling";

  // If only one kwalificatieprofiel, show it directly
  if (toetsdocumentenList.length === 1) {
    return (
      <div className="space-y-4">
        {canAssess ? (
          <AssessmentView
            toetsdocumenten={toetsdocumentenList[0]}
            aanvraag={aanvraag}
            beoordelingsCriteria={beoordelingsCriteria}
            personId={personId}
          />
        ) : (
          <ToetsdocumentenDisplay
            toetsdocumenten={toetsdocumentenList[0]}
            aanvraag={aanvraag}
            beoordelingsCriteria={beoordelingsCriteria}
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
                  beoordelingsCriteria={beoordelingsCriteria}
                  personId={personId}
                />
              ) : (
                <ToetsdocumentenDisplay
                  toetsdocumenten={item}
                  aanvraag={aanvraag}
                  beoordelingsCriteria={beoordelingsCriteria}
                />
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}
