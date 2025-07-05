import dayjs from "dayjs";
import { Badge } from "~/app/(dashboard)/_components/badge";
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
    <div className="space-y-3">
      {/* Status Section */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-2.5 py-2 -mx-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </Text>
              <Badge
                color={
                  statusColors[aanvraag.status as keyof typeof statusColors]
                }
                className="text-xs px-2 py-0.5 mt-0.5"
              >
                {statusLabels[aanvraag.status as keyof typeof statusLabels]}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Laatst gewijzigd
            </Text>
            <Text className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
              {dayjs(aanvraag.lastStatusChange).format("DD-MM-YYYY HH:mm")}
            </Text>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        <div>
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Aanvraag ID
          </Text>
          <Code className="inline-block text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded mt-0.5">
            {aanvraag.handle}
          </Code>
        </div>

        <div>
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Type
          </Text>
          <Badge
            color={aanvraag.type === "intern" ? "emerald" : "purple"}
            className="text-xs mt-0.5"
          >
            {aanvraag.type === "intern" ? "Intern" : "Extern"}
          </Badge>
        </div>

        <div>
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Kandidaat
          </Text>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {formatName(aanvraag.kandidaat).charAt(0).toUpperCase()}
              </span>
            </div>
            <Text className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {formatName(aanvraag.kandidaat)}
            </Text>
          </div>
        </div>

        <div>
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Locatie
          </Text>
          <div className="flex items-center gap-1 mt-0.5">
            <svg
              className="h-3 w-3 text-gray-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <Text className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {aanvraag.locatie.name}
            </Text>
          </div>
        </div>
      </div>

      {/* Leercoach Section */}
      {aanvraag.leercoach && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5">
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Leercoach
          </Text>
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {formatName(aanvraag.leercoach).charAt(0).toUpperCase()}
                </span>
              </div>
              <Text className="text-sm font-medium text-gray-900 dark:text-white">
                {formatName(aanvraag.leercoach)}
              </Text>
            </div>
            {aanvraag.leercoach.status && (
              <Badge
                color={
                  aanvraag.leercoach.status === "gegeven"
                    ? "green"
                    : aanvraag.leercoach.status === "gevraagd"
                      ? "yellow"
                      : "red"
                }
                className="text-xs px-1.5 py-0.5"
              >
                {aanvraag.leercoach.status === "gegeven"
                  ? "Akkoord"
                  : aanvraag.leercoach.status === "gevraagd"
                    ? "Gevraagd"
                    : "Geweigerd"}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Opmerkingen Section */}
      {aanvraag.opmerkingen && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5">
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Opmerkingen
          </Text>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-2 mt-1">
            <Text className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {aanvraag.opmerkingen}
            </Text>
          </div>
        </div>
      )}

      {/* Prerequisites Section */}
      {aanvraag.status === "wacht_op_voorwaarden" && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5">
          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5 text-amber-500"
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
            Voorwaarden Status
          </h4>
          {aanvraag.voorwaardenStatus.alleVoorwaardenVervuld ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-2">
              <div className="flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <Text className="text-xs font-medium text-green-800 dark:text-green-200">
                  Alle voorwaarden vervuld
                </Text>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-2">
              <Text className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                Ontbrekende voorwaarden:
              </Text>
              <ul className="space-y-0.5">
                {aanvraag.voorwaardenStatus.ontbrekendeVoorwaarden.map(
                  (voorwaarde) => (
                    <li
                      key={voorwaarde}
                      className="flex items-start gap-1 text-[11px] text-amber-700 dark:text-amber-300"
                    >
                      <svg
                        className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                      </svg>
                      <span>
                        {voorwaarde === "beoordelaar_toegewezen" &&
                          "Beoordelaar moet toegewezen zijn aan alle onderdelen"}
                        {voorwaarde === "leercoach_akkoord" &&
                          "Leercoach moet akkoord geven"}
                        {voorwaarde === "startdatum_gepland" &&
                          "Startdatum moet gepland zijn voor alle onderdelen"}
                      </span>
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
