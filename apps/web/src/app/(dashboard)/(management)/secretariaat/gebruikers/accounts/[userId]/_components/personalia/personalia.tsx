import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-v2";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import type { getUserById } from "~/lib/nwd";
import { ActionButtons } from "./action-button";

export async function PersonaliaContent({
  userPromise,
}: { userPromise: ReturnType<typeof getUserById> }) {
  const user = await userPromise;

  return (
    <DescriptionList>
      <DescriptionTerm>E-mailadres</DescriptionTerm>
      <DescriptionDetails>{user.email ?? "-"}</DescriptionDetails>

      <DescriptionTerm>Naam</DescriptionTerm>
      <DescriptionDetails>{user.displayName ?? "-"}</DescriptionDetails>
    </DescriptionList>
  );
}

export async function Personalia({
  userPromise,
}: { userPromise: ReturnType<typeof getUserById> }) {
  return (
    <StackedLayoutCard>
      <div className="flex justify-between items-center mb-3">
        <Subheading>Personalia</Subheading>
      </div>
      <Suspense
        fallback={
          <DescriptionList>
            <DescriptionTerm>E-mailadres</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>

            <DescriptionTerm>Naam</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>
          </DescriptionList>
        }
      >
        <PersonaliaContent userPromise={userPromise} />
      </Suspense>
      <Divider className="my-4" />
      <div className="flex justify-end">
        <ActionButtons userPromise={userPromise} />
      </div>
    </StackedLayoutCard>
  );
}
