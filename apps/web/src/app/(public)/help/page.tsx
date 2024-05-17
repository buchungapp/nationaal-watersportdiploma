import { BoxedButton } from "../_components/style/buttons";
import PageHero from "../_components/style/page-hero";
import Search from "./_components/search";

import type { Metadata, ResolvingMetadata } from "next";
import {
  getHelpArticles,
  getHelpCategories,
  getHelpFaqs,
} from "~/lib/article-2";
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
  const [questions, articles, categories] = await Promise.all([
    getHelpFaqs(),
    getHelpArticles(),
    getHelpCategories(),
  ]);

  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              Helpcentrum
            </h1>
            <p className="text-xl">
              Ontdek antwoorden op veelgestelde vragen, handige documenten en
              meer.
            </p>
          </div>
        </div>
      </PageHero>
      <div className="min-h-72 py-16 lg:py-32 w-full -mb-32 flex flex-col items-center justify-center gap-y-8 container mx-auto px-4 sm:px-6 lg:px-8 md:max-w-3xl">
        <h2 className="text-2xl font-bold lg:text-3xl xl:text-4xl text-gray-900">
          Hoe kunnen we helpen?
        </h2>
        <Search questions={questions} articles={articles} />

        <div className="grid break-inside-avoid gap-2 rounded-2xl bg-gray-100 px-6 pt-8 pb-10 w-full">
          <h2 className="text-lg font-semibold px-4">Populaire artikelen</h2>
          {articles
            .filter((x) => x.metadata.isPopulaire)
            .map((article) => (
              <BoxedButton
                key={article.slug}
                href={`/help/artikel/${article.slug}`}
                className="mt-2 text-branding-dark hover:bg-branding-dark/10 w-full"
              >
                <span className="mr-2">{article.metadata.title}</span>
              </BoxedButton>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => (
            <CategorieCard key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </main>
  );
}
