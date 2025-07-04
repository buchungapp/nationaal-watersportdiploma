import dayjs from "dayjs";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-v2";
import { Code, Text } from "~/app/(dashboard)/_components/text";
import type { retrievePvbAanvraagByHandle } from "~/lib/nwd";

type AanvraagType = Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;

export function AanvraagCard({ aanvraag }: { aanvraag: AanvraagType }) {
  const statusColors = {
    concept: "zinc",
    wacht_op_voorwaarden: "yellow",
    gereed_voor_beoordeling: "blue",
    in_beoordeling: "blue",
    afgerond: "green",
    ingetrokken: "red",
    afgebroken: "red",
  } as const;

  const statusLabels = {
    concept: "Concept",
    wacht_op_voorwaarden: "Wacht op voorwaarden",
    gereed_voor_beoordeling: "Gereed voor beoordeling",
    in_beoordeling: "In beoordeling",
    afgerond: "Afgerond",
    ingetrokken: "Ingetrokken",
    afgebroken: "Afgebroken",
  } as const;

  const formatName = (person: {
    firstName: string | null;
    lastNamePrefix: string | null;
    lastName: string | null;
  }) => {
    const parts = [
      person.firstName,
      person.lastNamePrefix,
      person.lastName,
    ].filter(Boolean);
    return parts.join(" ") || "Onbekend";
  };

  return (
    <div className="space-y-4">
      <DescriptionList>
        <DescriptionTerm>ID</DescriptionTerm>
        <DescriptionDetails>
          <Code>{aanvraag.handle}</Code>
        </DescriptionDetails>

        <DescriptionTerm>Status</DescriptionTerm>
        <DescriptionDetails>
          <Badge
            color={statusColors[aanvraag.status as keyof typeof statusColors]}
          >
            {statusLabels[aanvraag.status as keyof typeof statusLabels]}
          </Badge>
        </DescriptionDetails>

        <DescriptionTerm>Type</DescriptionTerm>
        <DescriptionDetails>
          {aanvraag.type === "intern" ? "Intern" : "Extern"}
        </DescriptionDetails>

        <DescriptionTerm>Kandidaat</DescriptionTerm>
        <DescriptionDetails>{formatName(aanvraag.kandidaat)}</DescriptionDetails>

        <DescriptionTerm>Locatie</DescriptionTerm>
        <DescriptionDetails>{aanvraag.locatie.name}</DescriptionDetails>

        <DescriptionTerm>Laatste wijziging</DescriptionTerm>
        <DescriptionDetails>
          {dayjs(aanvraag.lastStatusChange).format("DD-MM-YYYY HH:mm")}
        </DescriptionDetails>

        {aanvraag.leercoach && (
          <>
            <DescriptionTerm>Leercoach</DescriptionTerm>
            <DescriptionDetails>
              <div className="flex items-center gap-2">
                <span>{formatName(aanvraag.leercoach)}</span>
                {aanvraag.leercoach.status && (
                  <Badge
                    color={
                      aanvraag.leercoach.status === "gegeven"
                        ? "green"
                        : aanvraag.leercoach.status === "gevraagd"
                        ? "yellow"
                        : "red"
                    }
                  >
                    {aanvraag.leercoach.status === "gegeven"
                      ? "Akkoord"
                      : aanvraag.leercoach.status === "gevraagd"
                      ? "Gevraagd"
                      : "Geweigerd"}
                  </Badge>
                )}
              </div>
            </DescriptionDetails>
          </>
        )}

        {aanvraag.opmerkingen && (
          <>
            <DescriptionTerm>Opmerkingen</DescriptionTerm>
            <DescriptionDetails className="whitespace-pre-wrap">
              {aanvraag.opmerkingen}
            </DescriptionDetails>
          </>
        )}
      </DescriptionList>

      {aanvraag.status === "wacht_op_voorwaarden" && (
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Voorwaarden
          </h4>
          {aanvraag.voorwaardenStatus.alleVoorwaardenVervuld ? (
            <Badge color="green">Alle voorwaarden vervuld</Badge>
          ) : (
            <div className="space-y-2">
              <Text>Ontbrekende voorwaarden:</Text>
              <ul className="list-disc list-inside space-y-1">
                {aanvraag.voorwaardenStatus.ontbrekendeVoorwaarden.map(
                  (voorwaarde) => (
                    <li
                      key={voorwaarde}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {voorwaarde === "beoordelaar_toegewezen" &&
                        "Beoordelaar moet toegewezen zijn"}
                      {voorwaarde === "leercoach_akkoord" &&
                        "Leercoach moet akkoord geven"}
                      {voorwaarde === "startdatum_gepland" &&
                        "Startdatum moet gepland zijn"}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}