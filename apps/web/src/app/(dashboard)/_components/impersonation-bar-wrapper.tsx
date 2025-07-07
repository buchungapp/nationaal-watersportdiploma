import { Suspense } from "react";
import { getUserOrThrow } from "~/lib/nwd";
import { ImpersonationBar } from "./impersonation-bar";

async function ImpersonationBarContent() {
  try {
    const user = await getUserOrThrow();

    const isSystemAdmin = user._impersonation?.isImpersonating
      ? user._impersonation.originalUser?.email === "maurits@buchung.nl"
      : user.email === "maurits@buchung.nl";

    if (!isSystemAdmin) {
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
  } catch (error) {
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
