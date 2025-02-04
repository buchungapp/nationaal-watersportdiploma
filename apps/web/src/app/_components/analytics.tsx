"use client";

import { load, trackPageview } from "fathom-client";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production" &&
      !!process.env.NEXT_PUBLIC_FATHOM_ID
    ) {
      load(process.env.NEXT_PUBLIC_FATHOM_ID, {
        auto: false,
      });
    }
  }, []);

  // Record a pageview when route changes
  useEffect(() => {
    if (pathname) {
      if (posthog) {
        let url = window.origin + pathname;
        if (searchParams.toString()) {
          url = `${url}?${searchParams.toString()}`;
        }
        posthog.capture("$pageview", {
          $current_url: url,
        });
      }

      trackPageview({
        url: `${pathname}?${searchParams.toString()}`,
        referrer: document.referrer,
      });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

export default function Analytics() {
  return (
    <Suspense>
      <TrackPageView />
    </Suspense>
  );
}
