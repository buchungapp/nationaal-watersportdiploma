"use client";

import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useMap,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { normalizeUrl } from "~/utils/normalize-url";
import type { Location } from "../vaarlocaties/_lib/retrieve-locations";
interface Props {
  locations: Location[];
}

export function LocationsMapContainer({ children }: PropsWithChildren) {
  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      region=""
    >
      {children}
    </APIProvider>
  );
}

const SelectedLocationContext = createContext<
  | {
      selectedLocation: Location | null;
      setSelectedLocation: (location: Location | null) => void;
    }
  | undefined
>(undefined);

function useBounds(map: google.maps.Map | null, locations: Location[]) {
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  const setBoundsCallback = useCallback(() => {
    if (map) {
      if (!bounds) {
        const bounds = new google.maps.LatLngBounds();
        locations.forEach(({ geometry }) => bounds.extend(geometry!.location));
        setBounds(bounds);
        map.fitBounds(bounds);
        console.log("find bounds and fit");
      } else {
        console.log("bounds exist, fit again");

        map.fitBounds(bounds);
      }
    }
  }, [map, locations, bounds]);

  useEffect(() => {
    setBoundsCallback();
  }, [map, locations, setBoundsCallback]);

  return setBoundsCallback;
}

export function SelectedLocationProvider({
  children,
  locations,
}: PropsWithChildren<{ locations: Location[] }>) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const map = useMap();
  const resetBounds = useBounds(map, locations);

  const setSelectedLocationAndZoom = useCallback(
    (location: Location | null) => {
      if (location === null) {
        setSelectedLocation(location);
        resetBounds();
      } else {
        setSelectedLocation(location);
        if (map) {
          map.panTo(location.geometry!.location);
          map.setZoom(12);
        }
      }
    },
    [map],
  );

  return (
    <SelectedLocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation: setSelectedLocationAndZoom,
      }}
    >
      {children}
    </SelectedLocationContext.Provider>
  );
}

export const useSelectedLocation = () => {
  const context = useContext(SelectedLocationContext);

  if (context === undefined) {
    throw new Error(
      "useSelectedLocation must be used within a SelectedLocationProvider",
    );
  }

  return context;
};

export function LocationsMap({ locations }: Props) {
  const center = useRef<google.maps.LatLngLiteral>({
    lat: 52.0889,
    lng: 5.6581,
  });
  const isContextDefined = useContext(SelectedLocationContext) !== undefined;

  console.log("isContextDefined", isContextDefined);

  const MapComponent = (
    <Map
      mapId="ea3856b90f7238a7"
      defaultCenter={center.current}
      defaultZoom={10}
      disableDefaultUI={true}
      mapTypeId="roadmap"
    >
      {locations.map((location) => (
        <GoogleMapsMarker key={location.id} location={location} />
      ))}
    </Map>
  );

  return isContextDefined ? (
    MapComponent
  ) : (
    <SelectedLocationProvider locations={locations}>
      {MapComponent}
    </SelectedLocationProvider>
  );
}

function GoogleMapsMarker({ location }: { location: Location }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const { setSelectedLocation, selectedLocation } = useSelectedLocation();

  const isSelected = selectedLocation?.id === location.id;

  return (
    <AdvancedMarker
      ref={markerRef}
      position={location.geometry!.location}
      title={location.name}
      onClick={() => setSelectedLocation(location)}
    >
      <Pin
        background={"#007FFF"}
        borderColor={"#0047AB"}
        glyphColor={"#FF8000"}
      />

      {isSelected && (
        <InfoWindow
          anchor={marker}
          maxWidth={200}
          onCloseClick={() => setSelectedLocation(null)}
        >
          <h3 className="text-lg mt-1.5 font-semibold leading-5 text-gray-900">
            {location.name}
          </h3>
          <Link
            className="text-branding-dark hover:text-branding-light text-sm"
            href={location.url}
            target="_blank"
          >
            {normalizeUrl(location.url).split("//")[1]}
          </Link>
          <address className="mt-3 space-y-1 text-sm not-italic leading-6 text-gray-600">
            <p>{location.city}</p>
          </address>
        </InfoWindow>
      )}
    </AdvancedMarker>
  );
}
