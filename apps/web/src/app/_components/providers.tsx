"use client";

import type { Session } from "@supabase/supabase-js";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Provider as BalancerProvider } from "react-wrap-balancer";
import { BASE_URL } from "~/constants";
import { createClient } from "~/lib/supabase/client";
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

const SessionContext = createContext<{
  session: Session | null;
}>({ session: null });

function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const posthog = usePostHog();

  useEffect(() => {
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        posthog.reset();
      } else if (session) {
        setSession(session);
        posthog.identify(session.user.id, {
          email: session.user.email,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
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
