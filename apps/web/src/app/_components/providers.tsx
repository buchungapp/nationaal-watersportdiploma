"use client";

import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Provider as BalancerProvider } from "react-wrap-balancer";
import { BASE_URL } from "~/constants";
import { useSession } from "~/lib/auth/client";
import { invariant } from "~/utils/invariant";

if (typeof window !== "undefined") {
  const currentUrl = new URL(BASE_URL);
  currentUrl.pathname = "/ingest";

  invariant(process.env.NEXT_PUBLIC_POSTHOG_KEY, "Missing PostHog key");

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    api_host: `${currentUrl.toString().replace(/\/$/, "")}`,
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
  });
}

function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

const AppContext = createContext<{
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open?: boolean) => void;
  isSticky: boolean;
}>({
  isMobileMenuOpen: false,

  setMobileMenuOpen: () => {},
  isSticky: false,
});

export function useMobileMenuState() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useContext(AppContext);
  return [isMobileMenuOpen, setMobileMenuOpen] as const;
}

// @TODO see if we can move these to CSS-variables
export const TRUSTBAR_HEIGHT = 36;
const STICKY_NAV_OFFSET = 16;

export function useIsSticky() {
  const { isSticky } = useContext(AppContext);
  return isSticky;
}

export function CommonProviders({ children }: { children?: React.ReactNode }) {
  return (
    <PHProvider>
      <SessionProvider>{children}</SessionProvider>
    </PHProvider>
  );
}

function SessionProvider({ children }: PropsWithChildren) {
  const { data: session } = useSession();
  const posthog = usePostHog();
  const lastIdentifiedRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id ?? null;
    const lastIdentified = lastIdentifiedRef.current;

    if (!userId) {
      if (lastIdentified !== null) {
        posthog.reset();
        lastIdentifiedRef.current = null;
      }
      return;
    }

    if (userId !== lastIdentified) {
      posthog.identify(userId, { email: session?.user?.email });
      lastIdentifiedRef.current = userId;
    }
  }, [posthog, session]);

  return <>{children}</>;
}

export function MarketingProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const threshold = TRUSTBAR_HEIGHT - STICKY_NAV_OFFSET;
    const handleScroll = () => {
      const nextIsSticky = window.scrollY > threshold;
      setIsSticky((prev) => (prev === nextIsSticky ? prev : nextIsSticky));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        isMobileMenuOpen: mobileMenuOpen,
        setMobileMenuOpen: (newState) => {
          if (newState === undefined) {
            setMobileMenuOpen((curr) => !curr);
            return;
          }

          setMobileMenuOpen(newState);
          return;
        },
        isSticky,
      }}
    >
      <BalancerProvider>{children}</BalancerProvider>
    </AppContext.Provider>
  );
}
