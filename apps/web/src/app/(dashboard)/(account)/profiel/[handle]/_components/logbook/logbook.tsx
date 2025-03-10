import { createLoader, parseAsInteger } from "nuqs/server";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { listLogbooksForPerson } from "~/lib/nwd";
import { AddLogbook } from "./add-logbook";
import { LogbookTable } from "./logbook-table";

const searchParamsParser = createLoader({
  logbook_page: parseAsInteger.withDefault(1),
  logbook_limit: parseAsInteger.withDefault(25),
});

export async function Logbook({
  person,
  searchParams,
}: {
  person: {
    id: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const data = await listLogbooksForPerson({ personId: person.id });

  const parsedSq = searchParamsParser(searchParams);

  const logbooks = data.slice(
    (parsedSq.logbook_page - 1) * parsedSq.logbook_limit,
    parsedSq.logbook_page * parsedSq.logbook_limit,
  );

  return (
    <div className="lg:col-span-3">
      <div className="flex justify-between items-center mb-2 w-full">
        <Subheading>Jouw Logboek</Subheading>
        <AddLogbook className="-my-1.5" personId={person.id} />
      </div>
      <Text>Hieronder vind je een overzicht van alle vaaractiviteiten.</Text>
      <Divider className="mt-2 mb-4" />
      <LogbookTable
        logbooks={logbooks}
        totalItems={data.length}
        personId={person.id}
      />
    </div>
  );
}
