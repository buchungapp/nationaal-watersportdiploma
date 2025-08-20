import { Suspense } from "react";
import type { getUserById } from "~/lib/nwd";
import { ActionButtonDropdown } from "./action-button-dropdown";

type ActionButtonProps = {
  userPromise: ReturnType<typeof getUserById>;
};

export async function ActionButtons({ userPromise }: ActionButtonProps) {
  return (
    <Suspense fallback={<ActionButtonFallback />}>
      <ActionButtonContent userPromise={userPromise} />
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

async function ActionButtonContent({ userPromise }: ActionButtonProps) {
  const user = await userPromise;

  return <ActionButtonDropdown user={user} />;
}
