import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import type { Metadata, ResolvingMetadata } from "next";
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
    },
  };
}

export default async function Page() {
  const [articles, categories] = await Promise.all([
    getHelpArticles(),
    getHelpCategories(),
  ]);

  return (
    <div className="min-h-72 pt-16 pb-16 lg:pb-32 w-full -mb-32 flex flex-col items-center justify-center gap-y-8 container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-lg">
      <div className="grid break-inside-avoid gap-2 max-w-2xl rounded-2xl bg-gray-100 px-6 pt-8 pb-10 w-full">
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
                  <div>
                    <p className="mr-2 text-lg/6 text-branding-dark font-semibold">
                      {article.metadata.title}
                    </p>
                    <p className="text-gray-800 mt-1 font-normal">
                      {article.metadata.summary}
                    </p>
                  </div>

                  <div className="h-6 flex items-center justify-center">
                    <ArrowLongRightIcon
                      className="h-5 w-5 shrink-0 text-branding-dark transition-transform group-hover:translate-x-1"
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
    </div>
  );
}
