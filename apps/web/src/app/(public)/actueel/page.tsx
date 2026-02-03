import type { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import PageHero from "../_components/style/page-hero";
import ArticlesList from "./_components/articles-list";
import ArticlesLoading from "./_components/articles-loading";
import SideNavActueel from "./_components/side-nav";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Actueel",
    description:
      "Blijf op de hoogte van het laatste nieuws en vereniging updates.",
    alternates: {
      canonical: "/actueel",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Actueel",
      description:
        "Blijf op de hoogte van het laatste nieuws en vereniging updates.",
      url: "/actueel",
    },
  };
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              Actueel
            </h1>
            <p className="text-xl">
              Blijf op de hoogte van het laatste nieuws en vereniging updates.
            </p>
          </div>
        </div>
      </PageHero>
      <div className="mt-12 grid grid-cols-1 gap-12 px-4 sm:grid-cols-[1fr_3fr] lg:px-16">
        <div className="flex justify-end">
          <SideNavActueel />
        </div>
        <Suspense fallback={<ArticlesLoading />}>
          <ArticlesList searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
