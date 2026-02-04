"use client";

import {
  LocationsMap,
  LocationsMapContainer,
} from "../../_components/locations-map";
import type { Location } from "../../vaarlocaties/_lib/retrieve-locations";

export default function LocationsMapClient({
  locations,
}: {
  locations: Location[];
}) {
  return (
    <LocationsMapContainer>
      <LocationsMap locations={locations} />
    </LocationsMapContainer>
  );
}
