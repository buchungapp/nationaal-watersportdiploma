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

async function BackToCohortsContent(props: BackToCohortsLinkProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  return (
    <Link
      href={`/locatie/${params.location}/cohorten`}
      className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm/6"
    >
      <ChevronLeftIcon className="fill-zinc-400 dark:fill-zinc-500 size-4" />
      Cohorten
    </Link>
  );
}

export function BackToCohortsLinkFallback() {
  return (
    <span className="inline-block bg-gray-200 rounded w-24 h-5 animate-pulse" />
  );
}

export function BackToCohortsLink(props: BackToCohortsLinkProps) {
  return (
    <Suspense fallback={<BackToCohortsLinkFallback />}>
      <BackToCohortsContent params={props.params} />
    </Suspense>
  );
}
