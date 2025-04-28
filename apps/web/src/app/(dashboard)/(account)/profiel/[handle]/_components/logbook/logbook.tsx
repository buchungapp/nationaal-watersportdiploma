import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { listLogbooksForPerson } from "~/lib/nwd";
import { pageParamsCache } from "../../_searchParams";
import { AddLogbook } from "./add-logbook";
import { LogbookTable } from "./logbook-table";

export async function Logbook({
  person,
}: {
  person: {
    id: string;
  };
}) {
  const data = await listLogbooksForPerson({ personId: person.id });

  const parsedSq = pageParamsCache.all();

  const logbooks = data.slice(
    (parsedSq["logbook-page"] - 1) * parsedSq["logbook-limit"],
    parsedSq["logbook-page"] * parsedSq["logbook-limit"],
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
