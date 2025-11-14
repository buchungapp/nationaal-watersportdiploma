import Image from "next/image";
import Link from "next/link";
import { normalizeUrl } from "~/utils/normalize-url";
import { LocationsMap } from "../_components/locations-map";
import PageHero from "../_components/style/page-hero";

import type { Metadata, ResolvingMetadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { TouchTarget } from "~/app/(dashboard)/_components/button";
import {
  type SocialPlatform,
  listCategories,
  listDisciplines,
} from "~/lib/nwd";
import {
  Facebook,
  Instagram,
  LinkedIn,
  TikTok,
  Whatsapp,
  X,
  YouTube,
} from "../../_components/socials";
import { SelectedLocationProviderServer } from "../_components/locations-map-server";
import { FilterCard } from "./_components/filter-card";
import LocationCard, {
  SetActiveLocationButton,
} from "./_components/location-card";
import { retrieveLocations } from "./_lib/retrieve-locations";
import { loadSearchParams } from "./_search-params";

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

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParamsPromise = loadSearchParams(props.searchParams);
  const locationsPromise = searchParamsPromise.then(
    ({ disciplineId, categoryId }) =>
      retrieveLocations({ filter: { disciplineId, categoryId } }),
  );
  const disciplinesPromise = listDisciplines();
  const ageCategoriesPromise = listCategories().then((categories) =>
    categories.filter(
      (category) => category.parent?.handle === "leeftijdscategorie",
    ),
  );

  return (
    <>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="gap-6 grid text-white">
            <h1 className="max-w-lg font-bold text-4xl lg:text-5xl xl:text-6xl">
              Vaarlocaties
            </h1>
            <p className="text-xl">Vind een vaarlocatie bij jou in de buurt.</p>
          </div>
        </div>
      </PageHero>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 container">
        <div className="gap-8 grid sm:grid-cols-2">
          <div className="max-w-prose prose">
            <p className="mt-0 text-lg">
              Op zoek naar een vaarlocatie bij jou in de buurt? Hieronder vind
              je een overzicht van alle vaarlocaties die meedoen aan het
              Nationaal Watersportdiploma. Klik op de website van een locatie
              voor meer informatie.
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
          <Suspense
            fallback={
              <div className="bg-slate-100 p-4 rounded-2xl w-full animate-pulse" />
            }
          >
            <FilterCard
              disciplinesPromise={disciplinesPromise}
              ageCategoriesPromise={ageCategoriesPromise}
            />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="gap-12 grid grid-cols-1 lg:grid-cols-3 mt-16">
              <LocationListSkeleton />
              <div className="lg:col-span-2 rounded-sm w-full h-[80vh] overflow-hidden">
                <LocationsMap locations={[]} />
              </div>
            </div>
          }
        >
          <SelectedLocationProviderServer locationPromise={locationsPromise}>
            <div className="gap-12 grid grid-cols-1 lg:grid-cols-3 mt-16">
              <Suspense fallback={<LocationListSkeleton />}>
                <RandomLocationList
                  locationsPromise={locationsPromise}
                  disciplinesPromise={disciplinesPromise}
                  ageCategoriesPromise={ageCategoriesPromise}
                />
              </Suspense>
              <div className="lg:col-span-2 rounded-sm w-full h-[80vh] overflow-hidden">
                <LocationsMap />
              </div>
            </div>
          </SelectedLocationProviderServer>
        </Suspense>
      </div>
    </>
  );
}

async function RandomLocationList({
  locationsPromise,
  disciplinesPromise,
  ageCategoriesPromise,
}: {
  locationsPromise: ReturnType<typeof retrieveLocations>;
  disciplinesPromise: ReturnType<typeof listDisciplines>;
  ageCategoriesPromise: ReturnType<typeof listCategories>;
}) {
  const [locations, disciplines, ageCategories] = await Promise.all([
    locationsPromise,
    disciplinesPromise,
    ageCategoriesPromise,
  ]);

  // This is necessary to enable dynamic IO
  await connection();

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
    <div className="flex flex-col space-y-4 h-full lg:max-h-[80vh] lg:overflow-y-auto">
      {locations
        .toSorted(() => {
          // Random sort
          return Math.random() - 0.5;
        })
        .map((location) => (
          <LocationCard key={location.id} location={location}>
            <div>
              <div className="flex justify-between items-center">
                {/* Star rating */}
                {/* <Link
                        // Link to Google Maps page
                        href={location.googleUrl!}
                        target="_blank"
                        className="inline-flex items-center space-x-1"
                      >
                        <StarIcon className="size-4 text-branding-dark" />
                        <span className="font-semibold">{location.rating}</span>
                        <span className="text-slate-600 text-sm">
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
                  <h3 className="mt-1.5 font-semibold text-slate-900 text-lg leading-6">
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
            </div>

            <address className="space-y-1 mt-3 text-slate-600 text-sm not-italic leading-6">
              <p>{location.city}</p>
            </address>

            {location.logo ? (
              <div className="relative mt-2 max-w-full h-24">
                <Image
                  src={location.logo.url}
                  alt={location.logo.alt ?? ""}
                  fill
                  className="object-contain object-left"
                />
              </div>
            ) : null}

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
                  return order.indexOf(a.platform) - order.indexOf(b.platform);
                })
                .map(({ platform, url }) => {
                  const IconComponent = platformComponents[platform];
                  return IconComponent ? (
                    <li key={platform}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <TouchTarget>
                          <IconComponent className="size-4 text-branding-light/70 hover:text-branding-light" />
                        </TouchTarget>
                      </a>
                    </li>
                  ) : null;
                })}
            </ul>
          </LocationCard>
        ))}
    </div>
  );
}

function LocationListSkeleton() {
  return (
    <div className="flex flex-col space-y-4 h-full lg:max-h-[80vh] lg:overflow-y-auto">
      {[...Array(6)].map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={i}
          className="bg-white p-6 border border-slate-200 rounded-lg animate-pulse"
        >
          <div className="flex justify-between items-center">
            <div className="bg-slate-200 rounded w-20 h-6" />
          </div>
          <div className="mt-4">
            <div className="bg-slate-200 rounded w-48 h-6" />
          </div>
          <div className="mt-2">
            <div className="bg-slate-200 rounded w-32 h-4" />
          </div>
          <div className="mt-4">
            <div className="bg-slate-200 rounded w-24 h-4" />
          </div>
          <div className="flex gap-x-5 mt-6">
            {[...Array(4)].map((_, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <div key={j} className="bg-slate-200 rounded w-4 h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
