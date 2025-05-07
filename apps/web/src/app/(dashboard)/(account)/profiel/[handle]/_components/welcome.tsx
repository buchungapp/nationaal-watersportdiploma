import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { getPersonByHandle } from "~/lib/nwd";

type WelcomeProps = {
  params: Promise<{ handle: string }>;
};

async function WelcomeContent({ params }: WelcomeProps) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);

  return <Heading>Welkom {person.firstName}!</Heading>;
}

function WelcomeFallback() {
  return (
    <Heading>
      Welkom{" "}
      <span className="inline-block bg-gray-200 rounded w-24 h-6 align-middle animate-pulse" />
      !
    </Heading>
  );
}

export function Welcome({ params }: WelcomeProps) {
  return (
    <Suspense fallback={<WelcomeFallback />}>
      <WelcomeContent params={params} />
    </Suspense>
  );
}
