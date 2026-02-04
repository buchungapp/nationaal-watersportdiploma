"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Location } from "../../vaarlocaties/_lib/retrieve-locations";

const LocationsMapClient = dynamic(() => import("./locations-map-client"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-white/10 text-white">
      <div className="grid gap-2 text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-white/20" />
        <p className="text-sm text-white/80">Kaart laden…</p>
      </div>
    </div>
  );
}

export default function DeferredLocationsMap({
  locations,
}: {
  locations: Location[];
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldRender(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        rootMargin: "300px 0px",
        threshold: 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      {shouldRender ? (
        <LocationsMapClient locations={locations} />
      ) : (
        <MapSkeleton />
      )}
    </div>
  );
}
