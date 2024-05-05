"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Provider as BalancerProvider } from "react-wrap-balancer";
import { BASE_URL } from "~/constants";

function usePrevious<T>(value: T) {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

if (typeof window !== "undefined") {
  const currentUrl = new URL(BASE_URL);
  currentUrl.pathname = "/ingest";

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    api_host: `${currentUrl.toString().replace(/\/$/, "")}`,
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    persistence: "memory", // Don't use cookies so we avoid the cookie consent banner
  });
}

function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

const AppContext = createContext<{
  previousPathname?: string;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open?: boolean) => void;
  scrollPosition: number;
}>({
  isMobileMenuOpen: false,
  previousPathname: undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setMobileMenuOpen: () => {},
  scrollPosition: 0,
});

export function useHasPreviousPathname() {
  const { previousPathname } = useContext(AppContext);
  return !!previousPathname;
}

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
  return <PHProvider>{children}</PHProvider>;
}

export function MarketingProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const previousPathname = usePrevious(pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [scrollPosition, setScrollPosition] = useState(0);
  const handleScroll = () => {
    const position = window.scrollY;
    setScrollPosition(position);
  };

  const isClient = typeof window !== "undefined";

  useEffect(() => {
    if (pathname !== previousPathname && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname, previousPathname, mobileMenuOpen]);

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
        previousPathname,
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
