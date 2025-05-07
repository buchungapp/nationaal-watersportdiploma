import { Suspense } from "react";
import { getUserOrThrow } from "~/lib/nwd";
import posthog from "~/lib/posthog";

async function PageAnalyticsContent() {
  const user = await getUserOrThrow();

  posthog.capture({
    distinctId: user.authUserId,
    event: "viewed_profile",
    properties: {
      $set: { email: user.email, displayName: user.displayName },
    },
  });

  await posthog.shutdown();

  return null;
}

export function PageAnalytics() {
  return (
    <Suspense fallback={null}>
      <PageAnalyticsContent />
    </Suspense>
  );
}
