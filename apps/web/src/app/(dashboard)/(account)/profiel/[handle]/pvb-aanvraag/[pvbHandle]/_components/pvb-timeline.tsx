import dayjs from "dayjs";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { listPvbGebeurtenissen } from "~/lib/nwd";

function getEventDescription(
  type: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  data: Record<string, any> | null,
): string {
  const descriptions: Record<string, string> = {
    aanvraag_ingediend: "Aanvraag ingediend",
    leercoach_toestemming_gevraagd: "Leercoach toestemming gevraagd",
    leercoach_toestemming_gegeven: "Leercoach heeft toestemming gegeven",
    leercoach_toestemming_geweigerd: "Leercoach heeft toestemming geweigerd",
    voorwaarden_voltooid: "Alle voorwaarden vervuld",
    aanvraag_ingetrokken: "Aanvraag ingetrokken",
    onderdeel_toegevoegd: "Onderdeel toegevoegd",
    onderdeel_beoordelaar_gewijzigd: "Beoordelaar gewijzigd",
    onderdeel_startdatum_gewijzigd: "Startdatum gewijzigd",
    beoordeling_gestart: "Beoordeling gestart",
    beoordeling_afgerond: "Beoordeling afgerond",
  };

  return descriptions[type] || type;
}

function getEventColor(type: string): string {
  // Using subtle grayscale colors for less visual emphasis
  if (type.includes("gegeven") || type.includes("voltooid") || type.includes("afgerond")) {
    return "bg-gray-600 dark:bg-gray-500"; // Darker gray for positive events
  }
  if (type.includes("geweigerd") || type.includes("ingetrokken") || type.includes("afgebroken")) {
    return "bg-gray-400 dark:bg-gray-600"; // Lighter gray for negative events
  }
  return "bg-gray-500 dark:bg-gray-600"; // Medium gray for neutral events
}

export default async function PvbTimeline({
  aanvraagId,
}: {
  aanvraagId: string;
}) {
  const gebeurtenissen = await listPvbGebeurtenissen(aanvraagId);

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
    <div className="lg:col-start-3 lg:row-start-1">
      <Subheading>Tijdlijn</Subheading>
      <div className="mt-3 flow-root">
        <ul className="-mb-4">
          {gebeurtenissen.map((gebeurtenis, eventIdx) => (
            <li key={gebeurtenis.id}>
              <div className="relative pb-4">
                {eventIdx !== gebeurtenissen.length - 1 ? (
                  <span
                    className="absolute left-2.5 top-2.5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-2">
                  <div>
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center ring-4 ring-gray-50 dark:ring-gray-900 ${getEventColor(
                        gebeurtenis.gebeurtenisType,
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-200" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-x-2">
                      <div className="min-w-0 flex-1">
                        <Text className="text-xs font-medium leading-tight text-gray-700 dark:text-gray-300">
                          {getEventDescription(
                            gebeurtenis.gebeurtenisType,
                            gebeurtenis.data,
                          )}
                        </Text>
                        {gebeurtenis.reden && (
                          <Text className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            {gebeurtenis.reden}
                          </Text>
                        )}
                        <Text className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                          Door {formatName(gebeurtenis.persoon)}
                        </Text>
                      </div>
                      <time
                        dateTime={gebeurtenis.aangemaaktOp}
                        className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0"
                      >
                        {dayjs(gebeurtenis.aangemaaktOp).format(
                          "DD-MM-YYYY HH:mm",
                        )}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}