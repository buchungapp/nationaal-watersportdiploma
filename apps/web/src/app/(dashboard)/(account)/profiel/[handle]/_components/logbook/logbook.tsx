import type { User } from "@nawadi/core";
import { Suspense } from "react";
import Balancer from "react-wrap-balancer";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { AnimatedWave } from "~/app/_components/animated-wave";
import { listLogbooksForPerson } from "~/lib/nwd";
import { parseLogbookSearchParams } from "../../_searchParams";
import { AddLogbook } from "./add-logbook";
import { LogbookTable } from "./logbook-table";

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

  if (data.length < 1) {
    return (
      <div className="relative bg-zinc-50/50 pb-2 border-2 border-zinc-200 border-dashed rounded-md overflow-hidden">
        <div className="flex flex-col items-center mx-auto px-2 sm:px-4 pt-6 pb-10 max-w-lg text-center">
          <div className="space-y-2">
            <div>
              <Heading>
                <Balancer>
                  Je hebt nog geen vaaractiviteiten aangemaakt.
                </Balancer>
              </Heading>
            </div>
          </div>

          <div className="my-6">
            <AddLogbook personId={person.id} />
          </div>

          <Text>
            Wil je meer weten over deze functionaliteit?{" "}
            <TextLink
              href="/help/artikel/vaarlogboek-gebruiken"
              target="_blank"
            >
              Bezoek onze hulppagina.
            </TextLink>
          </Text>
        </div>
        <AnimatedWave textColorClassName="text-zinc-600" />
      </div>
    );
  }

  return (
    <>
      <div className="my-2">
        <Suspense fallback={<AddLogbookButtonFallback />}>
          <AddLogbookButton personPromise={personPromise} />
        </Suspense>
      </div>
      <LogbookTable
        logbooks={logbooks}
        totalItems={data.length}
        personId={person.id}
      />
    </>
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
      <Suspense
        fallback={
          <>
            <div className="my-2">
              <AddLogbookButtonFallback />
            </div>
            <LogbookTable
              logbooks={[]}
              totalItems={0}
              personId={""}
              placeholderRows={2}
            />
          </>
        }
      >
        <LogbookContent {...props} />
      </Suspense>
    </StackedLayoutCardDisclosure>
  );
}
