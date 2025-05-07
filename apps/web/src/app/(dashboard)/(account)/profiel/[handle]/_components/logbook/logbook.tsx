import { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { showNewLogBook } from "~/lib/flags";
import { getPersonByHandle, listLogbooksForPerson } from "~/lib/nwd";
import { parseLogbookSearchParams } from "../../_searchParams";
import { AddLogbook } from "./add-logbook";
import { LogbookTable } from "./logbook-table";

async function LogbookContent({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const showLogBook = await showNewLogBook();

  if (!showLogBook) {
    return null;
  }

  const { handle } = await params;
  const person = await getPersonByHandle(handle);
  const data = await listLogbooksForPerson({ personId: person.id });

  const parsedSq = await parseLogbookSearchParams(searchParams);

  const logbooks = data.slice(
    (parsedSq["logbook-page"] - 1) * parsedSq["logbook-limit"],
    parsedSq["logbook-page"] * parsedSq["logbook-limit"],
  );

  return (
    <LogbookTable
      logbooks={logbooks}
      totalItems={data.length}
      personId={person.id}
    />
  );
}

async function AddLogbookButton({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);

  return <AddLogbook className="-my-1.5" personId={person.id} />;
}

export function Logbook(props: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="lg:col-span-3">
      <div className="flex justify-between items-center mb-2 w-full">
        <Subheading>Jouw Logboek</Subheading>
        <Suspense
          fallback={
            <div className="bg-slate-200 -my-1.5 rounded-lg w-35.5 h-9 animate-pulse" />
          }
        >
          <AddLogbookButton params={props.params} />
        </Suspense>
      </div>
      <Text>Hieronder vind je een overzicht van alle vaaractiviteiten.</Text>
      <Divider className="mt-2 mb-4" />
      <Suspense
        fallback={
          <LogbookTable
            logbooks={[]}
            totalItems={0}
            personId={""}
            placeholderRows={2}
          />
        }
      >
        <LogbookContent {...props} />
      </Suspense>
    </div>
  );
}
