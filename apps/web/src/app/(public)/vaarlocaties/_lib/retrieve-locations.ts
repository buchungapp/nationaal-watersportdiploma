import { locations as locationsData } from "~/locations";

import {
  AddressType,
  Client,
  Language,
} from "@googlemaps/google-maps-services-js";
import { cache } from "react";

const mapsClient = new Client({});

async function retrieveLocationsWithAllMeta() {
  const locations = locationsData;

  const locationsWithCity = await Promise.all(
    locations.map(async (location) => {
      if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === undefined) {
        // When the Google Maps API key is not set, we return a dummy location
        return {
          ...location,
          rating: 0,
          user_ratings_total: 0,
          geometry: {
            location: {
              lat: 0,
              lng: 0,
            },
          },
          googleUrl: "",
          province: "",
          city: "",
          address_components: [],
        };
      }

      const placeDetails = await mapsClient
        .placeDetails({
          params: {
            place_id: location.placeId,
            language: Language.nl,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            fields: [
              "rating",
              "user_ratings_total",
              "address_components",
              "geometry",
              "url",
            ],
          },
        })
        .catch((error) => {
          console.error("Error retrieving place details", location.name);
          throw error;
        });

      const { rating, user_ratings_total, address_components, geometry, url } =
        placeDetails.data.result;

      return {
        ...location,
        rating,
        user_ratings_total,
        geometry,
        googleUrl: url,
        province: address_components?.find(
          ({ types }) =>
            types.includes(AddressType.administrative_area_level_1) &&
            types.includes(AddressType.political),
        )?.long_name,
        city: address_components?.find(
          ({ types }) =>
            types.includes(AddressType.locality) &&
            types.includes(AddressType.political),
        )?.long_name,
        address_components,
      };
    }),
  );

  return locationsWithCity;
}

export type Location = Awaited<
  ReturnType<typeof retrieveLocationsWithAllMeta>
>[number];

export const retrieveLocations = cache(retrieveLocationsWithAllMeta);
