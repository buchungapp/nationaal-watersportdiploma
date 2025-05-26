import { type PropsWithChildren, Suspense } from "react";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { getPersonByHandle, listLogbooksForPerson } from "~/lib/nwd";
import { parseLogbookSearchParams } from "../../_searchParams";
import { AddLogbook } from "./add-logbook";
import { LogbookTable } from "./logbook-table";

function LogbookSkeleton({
  children,
  button,
}: PropsWithChildren<{ button?: React.ReactNode | undefined }>) {
  return (
    <StackedLayoutCardDisclosure
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Jouw Logboek</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>
            Hieronder vind je een overzicht van alle vaaractiviteiten.
          </Text>
        </>
      }
    >
      <div className="my-2">{button}</div>

      {children}
    </StackedLayoutCardDisclosure>
  );
}

async function LogbookContent({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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

function AddLogbookButtonFallback() {
  return <div className="bg-slate-200 rounded-lg w-35.5 h-9 animate-pulse" />;
}

async function AddLogbookButton({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);

  return <AddLogbook personId={person.id} />;
}

export function Logbook(props: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <LogbookSkeleton
      button={
        <Suspense fallback={<AddLogbookButtonFallback />}>
          <AddLogbookButton params={props.params} />
        </Suspense>
      }
    >
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
    </LogbookSkeleton>
  );
}
