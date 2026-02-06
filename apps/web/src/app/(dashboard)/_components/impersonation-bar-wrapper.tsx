import { Suspense } from "react";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow } from "~/lib/nwd";
import { ImpersonationBar } from "./impersonation-bar";

async function ImpersonationBarContent() {
  try {
    const user = await getUserOrThrow();

    const isAdmin = user._impersonation?.isImpersonating
      ? isSystemAdmin(user._impersonation.originalUser?.email)
      : isSystemAdmin(user.email);

    if (!isAdmin) {
      return null;
    }

    const isImpersonating = !!user._impersonation?.isImpersonating;

    const impersonatedUser = isImpersonating
      ? {
          id: user.authUserId,
          email: user.email,
          displayName: user.displayName || undefined,
        }
      : undefined;

    return (
      <ImpersonationBar
        isImpersonating={isImpersonating}
        impersonatedUser={impersonatedUser}
      />
    );
  } catch (_error) {
    // If user is not logged in, don't show the bar
    return null;
  }
}

export function ImpersonationBarWrapper() {
  return (
    <Suspense fallback={null}>
      <ImpersonationBarContent />
    </Suspense>
  );
}
