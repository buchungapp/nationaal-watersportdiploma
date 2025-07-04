import dayjs from "dayjs";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { listPvbGebeurtenissen, retrievePvbAanvraagByHandle } from "~/lib/nwd";

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
  };

  return descriptions[type] || type;
}

function getEventColor(type: string): string {
  if (type.includes("gegeven") || type.includes("voltooid")) {
    return "bg-green-500 dark:bg-green-600";
  }
  if (type.includes("geweigerd") || type.includes("ingetrokken")) {
    return "bg-red-500 dark:bg-red-600";
  }
  if (type.includes("gevraagd")) {
    return "bg-yellow-500 dark:bg-yellow-600";
  }
  return "bg-blue-500 dark:bg-blue-600";
}

export default async function PvbTimeline({
  params,
}: {
  params: Promise<{ location: string; handle: string }>;
}) {
  const resolvedParams = await params;
  const aanvraag = await retrievePvbAanvraagByHandle(resolvedParams.handle);
  const gebeurtenissen = await listPvbGebeurtenissen(aanvraag.id);

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
      <div className="mt-4 flow-root">
        <ul className="-mb-8">
          {gebeurtenissen.map((gebeurtenis, eventIdx) => (
            <li key={gebeurtenis.id}>
              <div className="relative pb-8">
                {eventIdx !== gebeurtenissen.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900 ${getEventColor(
                        gebeurtenis.gebeurtenisType,
                      )}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-white" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <Text className="font-medium">
                        {getEventDescription(
                          gebeurtenis.gebeurtenisType,
                          gebeurtenis.data,
                        )}
                      </Text>
                      {gebeurtenis.reden && (
                        <Text className="mt-0.5">{gebeurtenis.reden}</Text>
                      )}
                      <Text className="mt-0.5 text-gray-500 dark:text-gray-400">
                        Door {formatName(gebeurtenis.persoon)}
                      </Text>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime={gebeurtenis.aangemaaktOp}>
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
