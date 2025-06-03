import type { User } from "@nawadi/core";
import { type PropsWithChildren, Suspense } from "react";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { listLogbooksForPerson } from "~/lib/nwd";
import { parseLogbookSearchParams } from "../../_searchParams";
import { AddLogbook } from "./add-logbook";
import { LogbookTable } from "./logbook-table";

function LogbookSkeleton({
  children,
  button,
}: PropsWithChildren<{ button?: React.ReactNode | undefined }>) {
  return (
    <StackedLayoutCardDisclosure
      defaultOpen
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Vaarlogboek</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>
            In jouw vaarlogboek kan je er voor kiezen om je vaaractiviteiten bij
            te houden.
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
  personPromise,
  searchParams,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const person = await personPromise;
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
  personPromise,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
}) {
  const person = await personPromise;

  return <AddLogbook personId={person.id} />;
}

export function Logbook(props: {
  personPromise: Promise<User.Person.$schema.Person>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <LogbookSkeleton
      button={
        <Suspense fallback={<AddLogbookButtonFallback />}>
          <AddLogbookButton {...props} />
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
