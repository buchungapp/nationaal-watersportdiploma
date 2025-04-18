"use cache";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import type { Metadata, ResolvingMetadata } from "next";
import { unstable_cacheLife } from "next/cache";
import Link from "next/link";
import { getHelpArticles, getHelpCategories } from "~/lib/article-2";
import CategorieCard from "./_components/categorie-card";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Helpcentrum",
    description:
      "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
    alternates: {
      canonical: "/help",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Helpcentrum",
      description:
        "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
      url: "/help",
      images: [
        {
          url: `/api/og?title=${encodeURIComponent("Helpcentrum")}&description=${encodeURIComponent("Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.")}`,
          width: 1200,
          height: 630,
          alt: "Helpcentrum",
        },
      ],
    },
  };
}

export default async function Page() {
  unstable_cacheLife("days");

  const [articles, categories] = await Promise.all([
    getHelpArticles(),
    getHelpCategories(),
  ]);

  return (
    <>
      <div className="grid break-inside-avoid gap-2 max-w-2xl mx-auto rounded-2xl bg-slate-100 px-6 pt-8 pb-10 w-full ring-1 ring-zinc-900/10">
        <h2 className="text-lg font-semibold px-4">Populaire artikelen</h2>
        <ul className="space-y-3.5">
          {articles
            .filter((x) => x.metadata.isPopulair)
            .map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/help/artikel/${article.slug}`}
                  className="group flex w-full gap-1 justify-between hover:bg-branding-dark/10 rounded-lg px-4 py-2 text-sm transition-colors"
                >
                  <div className="mr-2">
                    <p className="text-lg/6 text-branding-dark font-semibold">
                      {article.metadata.title}
                    </p>
                    <p className="text-slate-800 mt-1 font-normal">
                      {article.metadata.summary}
                    </p>
                  </div>

                  <div className="h-6 flex items-center justify-center">
                    <ArrowLongRightIcon
                      className="size-5 shrink-0 text-branding-dark transition-transform group-hover:translate-x-1"
                      strokeWidth={2.5}
                    />
                  </div>
                </Link>
              </li>
            ))}
        </ul>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <CategorieCard
          category={{
            slug: "veelgestelde-vragen",
            title: "Veelgestelde vragen",
            description: "Ontdek antwoorden op veelgestelde vragen.",
          }}
          base="/help"
        />
        {categories.map((category) => (
          <CategorieCard key={category.slug} category={category} />
        ))}
      </div>
    </>
  );
}
