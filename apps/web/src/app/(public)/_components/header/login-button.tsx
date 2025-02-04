import { Suspense } from "react";
import { getSession } from "~/utils/auth/session";
import { TekstButton } from "../style/buttons";

function LoginButton() {
  return <TekstButton href="/login">Login</TekstButton>;
}

async function ToAccount() {
  const session = await getSession();

  if (!session) {
    throw new Error("ToAccount requires a session");
  }

  return <TekstButton href="/dashboard">Jouw account</TekstButton>;
}

async function ConditionalButton() {
  const possibleSession = await getSession();

  if (possibleSession) {
    return <ToAccount />;
  }
  return <LoginButton />;
}

export default function ConditionalWithFallback() {
  return (
    <Suspense fallback={<LoginButton />}>
      <ConditionalButton />
    </Suspense>
  );
}
