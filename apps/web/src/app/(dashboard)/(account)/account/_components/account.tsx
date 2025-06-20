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
        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label
              htmlFor="displayName"
              className="block text-sm/6 font-medium text-gray-900"
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
              className="block text-sm/6 font-medium text-gray-900"
            >
              E-mailadres
            </label>
            <div className="mt-2">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                disabled
                defaultValue={user.email}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 mt-4 pt-4">
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
