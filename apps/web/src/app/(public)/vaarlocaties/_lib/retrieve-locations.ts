import {
  AddressType,
  Client,
  Language,
} from "@googlemaps/google-maps-services-js";
import { unstable_cacheLife as cacheLife } from "next/cache";
import { cache } from "react";
import { listAllLocations } from "~/lib/nwd";

const mapsClient = new Client({});

async function retrieveLocationsWithAllMeta() {
  "use cache";
  cacheLife("weeks");

  const locations = await listAllLocations();

  const locationsWithCity = await Promise.all(
    locations.map(async (location) => {
      if (
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === undefined ||
        !location.googlePlaceId
      ) {
        return {
          ...location,
          rating: undefined,
          user_ratings_total: undefined,
          geometry: undefined,
          googleUrl: undefined,
          province: undefined,
          city: undefined,
          address_components: undefined,
        };
      }

      const placeDetails = await mapsClient
        .placeDetails({
          params: {
            place_id: location.googlePlaceId,
            language: Language.nl,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            fields: ["address_components", "geometry", "url"],
          },
        })
        .catch((error) => {
          console.error("Error retrieving place details", location.name);
          throw error;
        });

      const { address_components, geometry, url } = placeDetails.data.result;

      return {
        ...location,
        rating: undefined,
        user_ratings_total: undefined,
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
