"use client";

import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useState } from "react";

const markers = [
  {
    id: 1,
    name: "Zeilschool De Veenhoop",
    position: { lat: 53.0956873, lng: 5.9414746 },
    url: "https://zeilschoolfriesland.nl/",
  },
  {
    id: 2,
    name: "Zeilschool de Kikkert",
    position: { lat: 52.8719666, lng: 5.640954 },
    url: "https://www.dekikkert.nl/",
  },
  {
    id: 3,
    name: "Zeilschool Het Molenhuis",
    position: { lat: 52.9420337, lng: 5.6265536 },
    url: "https://zeilschoolhetmolenhuis.com/",
  },
  {
    id: 4,
    name: "Zeilschool Wavie",
    position: { lat: 52.0013379, lng: 4.5502541 },
    url: "https://www.wavie.nl/",
  },
  {
    id: 5,
    name: "Krekt Sailing",
    position: { lat: 52.9948167, lng: 5.7144898 },
    url: "https://www.krektsailing.nl/",
  },
  {
    id: 6,
    name: "Zeil- en Surfschool Neptunus",
    position: { lat: 52.9294325, lng: 5.7085266 },
    url: "https://www.zeilschoolneptunus.nl/",
  },
  {
    id: 7,
    name: "Zeilschool Aalsmeer",
    position: { lat: 52.2504869, lng: 4.7556987 },
    url: "https://www.zeilschoolaalsmeer.nl/",
  },
  {
    id: 8,
    name: "Zeilschool Pean",
    position: { lat: 53.08001, lng: 5.8588931 },
    url: "https://www.pean.nl/",
  },
  {
    id: 9,
    name: "Zeilschool Vinkeveen",
    position: { lat: 52.2176868, lng: 4.9307842 },
    url: "https://www.vinkeveenhaven.nl/pages/zeilschool",
  },
];

export default function LocationsMap() {
  const [activeMarker, setActiveMarker] = useState<number | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    language: "nl",
    region: "nl",
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
    markers.forEach(({ position }) => bounds.extend(position));
    map.fitBounds(bounds);
  };

  return (
    <GoogleMap
      onLoad={handleOnLoad}
      onClick={() => setActiveMarker(null)}
      mapContainerStyle={{ width: "100%", height: "100%" }}
      zoom={7}
    >
      {markers.map(({ id, name, position, url }) => (
        <Marker
          key={id}
          position={position}
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
