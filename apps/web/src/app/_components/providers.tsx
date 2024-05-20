"use client";

import type { Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Provider as BalancerProvider } from "react-wrap-balancer";
import { BASE_URL } from "~/constants";
import { supabaseBrowser } from "~/lib/supabase/client";

if (typeof window !== "undefined") {
  const currentUrl = new URL(BASE_URL);
  currentUrl.pathname = "/ingest";

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
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
  scrollPosition: number;
}>({
  isMobileMenuOpen: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setMobileMenuOpen: () => {},
  scrollPosition: 0,
});

export function useMobileMenuState() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useContext(AppContext);
  return [isMobileMenuOpen, setMobileMenuOpen] as const;
}

// @TODO see if we can move these to CSS-variables
export const TRUSTBAR_HEIGHT = 36;
const STICKY_NAV_OFFSET = 16;

export function useIsSticky() {
  const { scrollPosition } = useContext(AppContext);
  return scrollPosition > TRUSTBAR_HEIGHT - STICKY_NAV_OFFSET;
}

export function CommonProviders({ children }: { children: React.ReactNode }) {
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
    } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
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
  const pathname = usePathname();
  const [previousPathname, setPreviousPathname] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname !== previousPathname) {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }

    setPreviousPathname(pathname);
  }

  const [scrollPosition, setScrollPosition] = useState(0);
  const handleScroll = () => {
    const position = window.scrollY;
    setScrollPosition(position);
  };

  const isClient = typeof window !== "undefined";

  useEffect(() => {
    if (!isClient) return;

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isClient]);

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
        scrollPosition,
      }}
    >
      <BalancerProvider>{children}</BalancerProvider>
    </AppContext.Provider>
  );
}
