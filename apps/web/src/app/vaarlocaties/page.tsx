import Link from "next/link";
import { locations } from "~/locations";
import { normalizeUrl } from "~/utils/normalize-url";
import LocationsMap from "../_components/locations-map";
import PageHero from "../_components/style/page-hero";

// import {
//   AddressType,
//   Client,
//   Language,
// } from "@googlemaps/google-maps-services-js";

// const mapsClient = new Client({});

export default function Page() {
  // const locationsWithCity = await Promise.all(
  //   locations.map(async (location) => {
  //     const { data } = await mapsClient
  //       .reverseGeocode({
  //         params: {
  //           latlng: `${location.position.lat},${location.position.lng}`,
  //           language: Language.nl,
  //         },
  //       })
  //       .catch((error) => {
  //         console.error("error", error);
  //         return { data: { results: [] } };
  //       });

  //     return {
  //       ...location,
  //       city: data.results[0]?.address_components.find((component) =>
  //         component.types.includes(AddressType.locality),
  //       )?.long_name,
  //     };
  //   }),
  // );

  return (
    <>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              Vaarlocaties
            </h1>
            <p className="text-xl">Vind een vaarlocatie bij jou in de buurt.</p>
          </div>
        </div>
      </PageHero>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-prose prose">
          <p className="mt-0 text-lg">
            Op zoek naar een vaarlocatie bij jou in de buurt? Hieronder vind je
            een overzicht van alle vaarlocaties die meedoen aan het Nationaal
            Watersportdiploma. Klik op de website van een locatie voor meer
            informatie.
          </p>
          <p>
            Benieuwd aan welke kwaliteitseisen een vaarlocatie moet voldoen om
            mee te doen aan het NWD?{" "}
            <Link
              href="/vaarlocaties/kwaliteitseisen"
              className="text-branding-dark hover:underline"
            >
              Bekijk de kwaliteitseisen
            </Link>
            .
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div
            className="columns-1 sm:columns-2 lg:columns-1 xl:columns-2 space-y-4"
            style={{
              columnFill: "balance",
            }}
          >
            {[...locations]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((location) => (
                <div
                  key={location.id}
                  className="rounded-2xl bg-gray-50 p-10 break-inside-avoid"
                >
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    {location.name}
                  </h3>
                  <Link
                    className="text-branding-dark hover:text-branding-light text-sm"
                    href={location.url}
                    target="_blank"
                  >
                    {normalizeUrl(location.url).split("//")[1].split("/")[0]}
                  </Link>
                  {/* <address className="mt-3 space-y-1 text-sm not-italic leading-6 text-gray-600">
                    <p>{location.city}</p>
                  </address> */}
                </div>
              ))}
          </div>
          <div className="w-full h-[80vh] rounded overflow-hidden">
            <LocationsMap />
          </div>
        </div>
      </div>
    </>
  );
}
