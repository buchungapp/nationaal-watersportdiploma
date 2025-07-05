import dayjs from "dayjs";
import type React from "react";
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

function getEventIcon(type: string) {
  const iconMap: Record<string, React.ReactNode> = {
    aanvraag_ingediend: (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
    leercoach_toestemming_gevraagd: (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
        />
      </svg>
    ),
    leercoach_toestemming_gegeven: (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    leercoach_toestemming_geweigerd: (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    voorwaarden_voltooid: (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
    onderdeel_beoordelaar_gewijzigd: (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    ),
    beoordeling_gestart: (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
        />
      </svg>
    ),
    beoordeling_afgerond: (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    iconMap[type] || (
      <svg
        className="h-3.5 w-3.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  );
}

function getEventColor(type: string): string {
  if (
    type.includes("gegeven") ||
    type.includes("voltooid") ||
    type.includes("afgerond")
  ) {
    return "bg-green-500 dark:bg-green-600";
  }
  if (
    type.includes("geweigerd") ||
    type.includes("ingetrokken") ||
    type.includes("afgebroken")
  ) {
    return "bg-red-500 dark:bg-red-600";
  }
  if (type.includes("gevraagd") || type.includes("gestart")) {
    return "bg-blue-500 dark:bg-blue-600";
  }
  return "bg-gray-500 dark:bg-gray-600";
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
    <div>
      <Subheading className="text-base font-semibold text-gray-900 dark:text-white mb-3">
        Tijdlijn
      </Subheading>

      {gebeurtenissen.length === 0 ? (
        <div className="text-center py-6">
          <svg
            className="mx-auto h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <Text className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
            Nog geen gebeurtenissen
          </Text>
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-6">
            {gebeurtenissen.map((gebeurtenis, eventIdx) => (
              <li key={gebeurtenis.id}>
                <div className="relative pb-6">
                  {eventIdx !== gebeurtenissen.length - 1 ? (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-2.5">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-6 ring-white dark:ring-gray-800 ${getEventColor(
                          gebeurtenis.gebeurtenisType,
                        )}`}
                      >
                        {getEventIcon(gebeurtenis.gebeurtenisType)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div>
                        <Text className="text-xs font-medium text-gray-900 dark:text-white">
                          {getEventDescription(
                            gebeurtenis.gebeurtenisType,
                            gebeurtenis.data,
                          )}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Door {formatName(gebeurtenis.persoon)}
                          {gebeurtenis.reden && (
                            <span className="italic text-gray-600 dark:text-gray-400">
                              {" "}
                              • "{gebeurtenis.reden}"
                            </span>
                          )}
                        </Text>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {dayjs(gebeurtenis.aangemaaktOp).format(
                          "DD MMM YYYY om HH:mm",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
