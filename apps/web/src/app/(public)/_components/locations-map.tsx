"use client";

import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useState } from "react";
import type { Location } from "../vaarlocaties/_lib/retrieve-locations";

export default function LocationsMap({
  locations = [],
}: {
  locations: Location[];
}) {
  const [activeMarker, setActiveMarker] = useState<number | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    language: "nl",
    region: "nl",
    version: "3.53",
  });

  if (!isLoaded) {
    return null;
  }

  const handleActiveMarker = (marker: number) => {
    if (marker === activeMarker) {
      return;
    }

    setActiveMarker(marker);
  };

  const handleOnLoad = (map: google.maps.Map) => {
    const bounds = new google.maps.LatLngBounds();
    locations.forEach(({ geometry }) => bounds.extend(geometry!.location));
    map.fitBounds(bounds);
  };

  return (
    <GoogleMap
      onLoad={handleOnLoad}
      onClick={() => setActiveMarker(null)}
      mapContainerStyle={{ width: "100%", height: "100%" }}
      zoom={7}
    >
      {locations.map(({ id, geometry, name, url }) => (
        <Marker
          key={id}
          position={geometry!.location}
          onClick={() => handleActiveMarker(id)}
        >
          {activeMarker === id ? (
            <InfoWindow onCloseClick={() => setActiveMarker(null)}>
              <div>
                {name}
                <br />
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-branding-light"
                >
                  {url}
                </a>
              </div>
            </InfoWindow>
          ) : null}
        </Marker>
      ))}
    </GoogleMap>
  );
}
