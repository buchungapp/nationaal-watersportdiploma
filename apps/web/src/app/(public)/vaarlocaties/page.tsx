import Link from "next/link";
import { normalizeUrl } from "~/utils/normalize-url";
import {
  LocationsMap,
  SelectedLocationProvider,
} from "../_components/locations-map";
import PageHero from "../_components/style/page-hero";

import type { Metadata, ResolvingMetadata } from "next";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { TouchTarget } from "~/app/(dashboard)/_components/button";
import type { SocialPlatform } from "~/lib/nwd";
import {
  Facebook,
  Instagram,
  LinkedIn,
  TikTok,
  Whatsapp,
  X,
  YouTube,
} from "../../_components/socials";
import LocationCard, {
  SetActiveLocationButton,
} from "./_components/location-card";
import { retrieveLocations } from "./_lib/retrieve-locations";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Vaarlocaties",
    description: "Vind een NWD vaarlocatie bij jou in de buurt.",
    alternates: {
      canonical: "/vaarlocaties",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Vaarlocaties",
      description: "Vind een NWD vaarlocatie bij jou in de buurt.",
      url: "/vaarlocaties",
    },
  };
}

const platformComponents = {
  whatsapp: Whatsapp,
  instagram: Instagram,
  tiktok: TikTok,
  facebook: Facebook,
  youtube: YouTube,
  x: X,
  linkedin: LinkedIn,
} as const;

export default async function Page() {
  const locations = await retrieveLocations();

  // for each possible color in the badge component, we want to assign a color to a province
  const provinceColors = {
    Friesland: "blue",
    "Noord-Holland": "orange",
    "Zuid-Holland": "green",
    Utrecht: "yellow",
    Flevoland: "sky",
    Overijssel: "rose",
    Gelderland: "purple",
    Drenthe: "violet",
    Groningen: "cyan",
    "Noord-Brabant": "amber",
    Limburg: "red",
    Zeeland: "teal",
  } as const;

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

        <SelectedLocationProvider locations={locations}>
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="flex flex-col space-y-4 h-full lg:max-h-[80vh] lg:overflow-y-auto">
              {[...locations]
                .sort(() => {
                  // Random sort
                  return Math.random() - 0.5;
                })
                .map((location) => (
                  <LocationCard key={location.id} location={location}>
                    <div className="flex items-center justify-between">
                      {/* Star rating */}
                      {/* <Link
                        // Link to Google Maps page
                        href={location.googleUrl!}
                        target="_blank"
                        className="inline-flex items-center space-x-1"
                      >
                        <StarIcon className="w-4 h-4 text-branding-dark" />
                        <span className="font-semibold">{location.rating}</span>
                        <span className="text-sm text-gray-600">
                          ({location.user_ratings_total} reviews)
                        </span>
                      </Link> */}

                      {location.province ? (
                        <Badge
                          color={
                            provinceColors[
                              location.province as keyof typeof provinceColors
                            ]
                          }
                        >
                          {location.province}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="block">
                      <SetActiveLocationButton location={location}>
                        <h3 className="text-lg mt-1.5 font-semibold leading-6 text-gray-900">
                          {location.name}
                        </h3>
                      </SetActiveLocationButton>
                    </div>
                    {location.websiteUrl ? (
                      <Link
                        className="text-branding-dark hover:text-branding-light text-sm"
                        href={location.websiteUrl}
                        target="_blank"
                      >
                        {normalizeUrl(location.websiteUrl).split("//")[1]}
                      </Link>
                    ) : null}
                    <address className="mt-3 space-y-1 text-sm not-italic leading-6 text-gray-600">
                      <p>{location.city}</p>
                    </address>

                    {/* Socials */}
                    <ul className="flex gap-x-5 mt-6">
                      {location.socialMedia
                        .sort((a, b) => {
                          const order: SocialPlatform[] = [
                            "whatsapp",
                            "instagram",
                            "tiktok",
                            "facebook",
                            "youtube",
                            "linkedin",
                            "x",
                          ];
                          return (
                            order.indexOf(a.platform) -
                            order.indexOf(b.platform)
                          );
                        })
                        .map(({ platform, url }) => {
                          const IconComponent = platformComponents[platform];
                          return IconComponent ? (
                            <li key={platform}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <TouchTarget>
                                  <IconComponent className="w-4 h-4 text-branding-light/70 hover:text-branding-light" />
                                </TouchTarget>
                              </a>
                            </li>
                          ) : null;
                        })}
                    </ul>
                  </LocationCard>
                ))}
            </div>
            <div className="w-full lg:col-span-2 h-[80vh] rounded-sm overflow-hidden">
              <LocationsMap locations={locations} />
            </div>
          </div>
        </SelectedLocationProvider>
      </div>
    </>
  );
}
