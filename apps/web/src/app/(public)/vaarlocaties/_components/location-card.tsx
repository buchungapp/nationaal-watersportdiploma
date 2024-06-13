"use client";

import clsx from "clsx";
import { PropsWithChildren, useEffect, useRef } from "react";
import { useSelectedLocation } from "../../_components/locations-map";
import { Location } from "../_lib/retrieve-locations";

export default function LocationCard({
  location,
  children,
}: PropsWithChildren<{ location: Location }>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { selectedLocation } = useSelectedLocation();

  const isSelected = selectedLocation?.id === location.id;

  //   Scroll to the card when it is selected
  useEffect(() => {
    // Ignore if viewport is smaller than 1240px (lg)
    if (window.innerWidth < 1024) return;

    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [isSelected]);

  return (
    <div
      ref={cardRef}
      className={clsx(
        "rounded-2xl bg-gray-50 p-10 break-inside-avoid border-2",
        isSelected ? "border-branding-orange" : "border-gray-200",
      )}
    >
      {children}
    </div>
  );
}

export function SetActiveLocationButton({
  location,
  children,
}: PropsWithChildren<{ location: Location }>) {
  const { setSelectedLocation } = useSelectedLocation();

  return (
    <button onClick={() => setSelectedLocation(location)}>{children}</button>
  );
}
