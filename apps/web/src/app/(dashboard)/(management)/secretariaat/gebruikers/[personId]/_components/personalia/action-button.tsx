import type { User } from "@nawadi/core";
import { Suspense } from "react";
import { listCountries } from "~/lib/nwd";
import { ActionButtonDropdown } from "./action-button-dropdown";

type ActionButtonProps = {
  personPromise: Promise<User.Person.$schema.Person>;
};

export async function ActionButtons({ personPromise }: ActionButtonProps) {
  return (
    <Suspense fallback={<ActionButtonFallback />}>
      <ActionButtonContent personPromise={personPromise} />
    </Suspense>
  );
}

export function ActionButtonFallback() {
  return (
    <div className="flex items-center gap-1 -my-1.5 animate-pulse shrink-0">
      <div className="bg-slate-200 rounded-lg w-28 h-9" />
    </div>
  );
}

async function ActionButtonContent({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
  const person = await personPromise;
  const countries = await listCountries();

  return <ActionButtonDropdown person={person} countries={countries} />;
}
