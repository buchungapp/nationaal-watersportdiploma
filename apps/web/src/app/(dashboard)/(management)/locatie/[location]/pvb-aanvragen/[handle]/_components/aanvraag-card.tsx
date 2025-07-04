import dayjs from "dayjs";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Code, Text } from "~/app/(dashboard)/_components/text";
import { retrievePvbAanvraagByHandle } from "~/lib/nwd";

export async function AanvraagCard(props: {
  params: Promise<{ location: string; handle: string }>;
}) {
  const params = await props.params;
  const aanvraag = await retrievePvbAanvraagByHandle(params.handle);

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
      <dl className="text-sm leading-6 divide-y divide-gray-100 dark:divide-gray-700">
        <div className="flex justify-between gap-x-4 py-3">
          <dt className="text-gray-500 dark:text-gray-400">ID</dt>
          <dd>
            <Code>{aanvraag.handle}</Code>
          </dd>
        </div>

        <div className="flex justify-between gap-x-4 py-3">
          <dt className="text-gray-500 dark:text-gray-400">Status</dt>
          <dd>
            <Badge
              color={statusColors[aanvraag.status as keyof typeof statusColors]}
            >
              {statusLabels[aanvraag.status as keyof typeof statusLabels]}
            </Badge>
          </dd>
        </div>

        <div className="flex justify-between gap-x-4 py-3">
          <dt className="text-gray-500 dark:text-gray-400">Type</dt>
          <dd className="text-gray-900 dark:text-gray-100">
            {aanvraag.type === "intern" ? "Intern" : "Extern"}
          </dd>
        </div>

        <div className="flex justify-between gap-x-4 py-3">
          <dt className="text-gray-500 dark:text-gray-400">Kandidaat</dt>
          <dd className="text-gray-900 dark:text-gray-100">
            {formatName(aanvraag.kandidaat)}
          </dd>
        </div>

        <div className="flex justify-between gap-x-4 py-3">
          <dt className="text-gray-500 dark:text-gray-400">Locatie</dt>
          <dd className="text-gray-900 dark:text-gray-100">
            {aanvraag.locatie.name}
          </dd>
        </div>

        <div className="flex justify-between gap-x-4 py-3">
          <dt className="text-gray-500 dark:text-gray-400">
            Laatste statuswijziging
          </dt>
          <dd className="text-gray-900 dark:text-gray-100">
            {dayjs(aanvraag.lastStatusChange).format("DD-MM-YYYY HH:mm")}
          </dd>
        </div>

        {aanvraag.leercoach && (
          <div className="flex justify-between gap-x-4 py-3">
            <dt className="text-gray-500 dark:text-gray-400">Leercoach</dt>
            <dd className="text-gray-900 dark:text-gray-100">
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
            </dd>
          </div>
        )}

        {aanvraag.opmerkingen && (
          <div className="flex flex-col gap-y-2 py-3">
            <dt className="text-gray-500 dark:text-gray-400">Opmerkingen</dt>
            <dd className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {aanvraag.opmerkingen}
            </dd>
          </div>
        )}
      </dl>

      {aanvraag.status === "wacht_op_voorwaarden" && (
        <>
          <Divider />
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
        </>
      )}
    </div>
  );
}
