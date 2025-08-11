import { Suspense } from "react";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Input } from "~/app/(dashboard)/_components/input";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import Spinner from "~/app/_components/spinner";
import { getUserOrThrow } from "~/lib/nwd";
import { AccountForm, SubmitButton } from "./account-client";

async function AccountContent() {
  const user = await getUserOrThrow();

  return (
    <AccountForm>
      <div className="">
        <div className="gap-x-6 gap-y-8 grid grid-cols-1 sm:grid-cols-6 max-w-2xl">
          <div className="sm:col-span-2">
            <label
              htmlFor="displayName"
              className="block font-medium text-gray-900 text-sm/6"
            >
              Hoe mogen we je noemen?
            </label>
            <div className="mt-2">
              <Input
                id="displayName"
                name="displayName"
                type="text"
                minLength={3}
                defaultValue={user.displayName ?? undefined}
                autoComplete="given-name"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label
              htmlFor="email"
              className="block font-medium text-gray-900 text-sm/6"
            >
              E-mailadres
            </label>
            <div className="mt-2">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={user.email}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end items-center gap-x-6 mt-4 pt-4 border-gray-900/10 border-t">
        <SubmitButton />
      </div>
    </AccountForm>
  );
}

export function Account() {
  return (
    <div>
      <StackedLayoutCard className="mb-3">
        <Subheading>Jouw account</Subheading>
        <div className="mt-4">
          <Suspense fallback={<Spinner />}>
            <AccountContent />
          </Suspense>
        </div>
      </StackedLayoutCard>
    </div>
  );
}
