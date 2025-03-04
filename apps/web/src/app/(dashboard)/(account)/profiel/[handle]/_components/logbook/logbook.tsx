import { createLoader, parseAsInteger } from "nuqs/server";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { LogbookTable } from "./logbook-table";

const searchParamsParser = createLoader({
  logbook_page: parseAsInteger.withDefault(1),
  logbook_limit: parseAsInteger.withDefault(25),
});

export function Logbook({
  person,
  searchParams,
}: {
  person: {
    id: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const data = [
    {
      id: "1",
      personId: person.id,
      startedAt: "2024-01-15T09:00:00Z",
      endedAt: "2024-01-15T17:00:00Z",
      departurePort: "Scheveningen",
      arrivalPort: "IJmuiden",
      windPower: 12,
      windDirection: "NW",
      boatType: "Bavaria 37",
      boatLength: 11.3,
      location: "Noordzee",
      sailedNauticalMiles: 35,
      sailedHoursInDark: 0,
      primaryRole: "Schipper",
      crewNames: "Jan, Piet, Klaas",
      conditions: "Licht bewolkt, rustige zee",
      additionalComments: "Mooie dagtocht langs de kust",
      createdAt: "2024-01-15T19:00:00Z",
      updatedAt: "2024-01-15T19:00:00Z",
    },
    {
      id: "2",
      personId: person.id,
      startedAt: "2024-02-01T14:00:00Z",
      endedAt: "2024-02-02T11:00:00Z",
      departurePort: "Den Helder",
      arrivalPort: "Terschelling",
      windPower: 18,
      windDirection: "ZW",
      boatType: "Dehler 34",
      boatLength: 10.4,
      location: "Waddenzee",
      sailedNauticalMiles: 45,
      sailedHoursInDark: 8,
      primaryRole: "Stuurman",
      crewNames: "Anna, Mark",
      conditions: "Bewolkt met buien, ruwe zee",
      additionalComments: "Uitdagende nachtelijke oversteek",
      createdAt: "2024-02-02T12:00:00Z",
      updatedAt: "2024-02-02T12:00:00Z",
    },
    {
      id: "3",
      personId: person.id,
      startedAt: "2024-02-20T10:00:00Z",
      endedAt: "2024-02-20T16:00:00Z",
      departurePort: "Enkhuizen",
      arrivalPort: "Medemblik",
      windPower: 8,
      windDirection: "O",
      boatType: "Jeanneau Sun Odyssey 36i",
      boatLength: 11.0,
      location: "IJsselmeer",
      sailedNauticalMiles: 15,
      sailedHoursInDark: 0,
      primaryRole: "Bemanningslid",
      crewNames: "Sophie, Thomas",
      conditions: "Zonnig, kalme zee",
      additionalComments: "Perfecte omstandigheden voor training",
      createdAt: "2024-02-20T17:00:00Z",
      updatedAt: "2024-02-20T17:00:00Z",
    },
  ];

  const parsedSq = searchParamsParser(searchParams);

  const logbooks = data.slice(
    (parsedSq.logbook_page - 1) * parsedSq.logbook_limit,
    parsedSq.logbook_page * parsedSq.logbook_limit,
  );

  return (
    <div className="lg:col-span-3">
      <div className="flex justify-between items-center mb-2 w-full">
        <Subheading>Jouw Logboek</Subheading>
      </div>
      <Text>Hieronder vind je een overzicht van alle vaaractiviteiten.</Text>
      <Divider className="mt-2 mb-4" />
      <LogbookTable logbooks={logbooks} totalItems={data.length} />
    </div>
  );
}
