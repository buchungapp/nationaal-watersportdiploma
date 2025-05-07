import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { getUserOrThrow } from "~/lib/nwd";

async function WelcomeContent() {
  const user = await getUserOrThrow();

  return (
    <Heading>Welkom{user.displayName ? ` ${user.displayName}` : ""}!</Heading>
  );
}

function WelcomeFallback() {
  return <Heading>Welkom!</Heading>;
}

export function Welcome() {
  return (
    <Suspense fallback={<WelcomeFallback />}>
      <WelcomeContent />
    </Suspense>
  );
}
