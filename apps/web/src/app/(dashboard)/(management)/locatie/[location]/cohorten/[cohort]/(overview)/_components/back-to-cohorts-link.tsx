import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { retrieveCohortByHandle, retrieveLocationByHandle } from "~/lib/nwd";

interface BackToCohortsLinkProps {
  params: Promise<{
    location: string;
    cohort: string;
  }>;
}

function BackToCohortsTemplate({ url }: { url: string }) {
  return (
    <Link
      href={url}
      className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm/6"
    >
      <ChevronLeftIcon className="fill-zinc-400 dark:fill-zinc-500 size-4" />
      Cohorten
    </Link>
  );
}

async function BackToCohortsContent(props: BackToCohortsLinkProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  return <BackToCohortsTemplate url={`/locatie/${params.location}/cohorten`} />;
}

export function BackToCohortsLink({ params }: BackToCohortsLinkProps) {
  return (
    <Suspense fallback={<BackToCohortsTemplate url="#" />}>
      <BackToCohortsContent params={params} />
    </Suspense>
  );
}
