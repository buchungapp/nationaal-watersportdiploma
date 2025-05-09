import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import { Link } from "~/app/(dashboard)/_components/link";

async function ProfileLinkContent(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  return (
    <Link
      href={`/profiel/${params.handle}`}
      className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm/6"
    >
      <ChevronLeftIcon className="fill-zinc-400 dark:fill-zinc-500 size-4" />
      Jouw profiel
    </Link>
  );
}

function ProfileLinkFallback() {
  return (
    <Link
      href="#"
      className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm/6"
    >
      <ChevronLeftIcon className="fill-zinc-400 dark:fill-zinc-500 size-4" />
      Jouw profiel
    </Link>
  );
}

export function ProfileLink(props: { params: Promise<{ handle: string }> }) {
  return (
    <Suspense fallback={<ProfileLinkFallback />}>
      <ProfileLinkContent params={props.params} />
    </Suspense>
  );
}
