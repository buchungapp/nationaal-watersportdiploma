import { ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { getAllArticles } from "~/lib/articles";
import Article from "../_components/style/article";
import PageHero from "../_components/style/page-hero";
import { formatDate } from "../_utils/format-date";

import type { Metadata, ResolvingMetadata } from "next";
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

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  let articles = await getAllArticles();

  if (searchParams.filter) {
    articles = articles.filter((article) => {
      return Array.isArray(searchParams.filter)
        ? searchParams.filter.includes(article.category)
        : searchParams.filter === article.category;
    });
  }

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
        <div className="flex flex-col justify-center gap-16">
          {articles.length < 1 ? (
            <p className="text-2xl text-gray-500">
              Er zijn geen artikelen gevonden.
            </p>
          ) : null}
          {articles.map((article) => (
            <div
              key={article.slug}
              className="grid gap-2 sm:grid-cols-[12rem_1fr]"
            >
              <p className="text-xs text-gray-400">
                {formatDate(article.date)}
              </p>

              <Link
                href={`/actueel/${article.slug}`}
                className="-m-4 rounded-3xl p-4 transition-colors hover:bg-gray-100 max-w-xl"
              >
                <Article>
                  <Article.Heading className="text-xs text-gray-400">
                    {article.category}
                  </Article.Heading>
                  <Article.Title>{article.title}</Article.Title>
                  <Article.Paragraph className="text-gray-700">
                    {article.description}
                  </Article.Paragraph>
                  <div
                    className={clsx(
                      "group -mx-2.5 -my-1.5 flex w-fit items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors",
                      "mt-4 text-branding-orange",
                    )}
                  >
                    Lees meer
                    <ArrowRightIcon
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={2.5}
                    />
                  </div>
                </Article>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
