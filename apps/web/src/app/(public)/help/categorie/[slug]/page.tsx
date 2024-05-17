import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getHelpCategories } from "~/lib/article-2";
import PageHero from "../../../_components/style/page-hero";

interface PageProps {
  params: {
    slug: string;
  };
}

async function findCategory(slug: string) {
  const categories = await getHelpCategories();

  return categories.find((category) => category.slug === slug);
}

export async function generateMetadata(
  { params: { slug } }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const [parentMeta, category] = await Promise.all([
    parent,
    findCategory(slug),
  ]);

  if (!category) {
    notFound();
  }

  return {
    title: category.title,
    description: category.description ?? parentMeta.description,
    alternates: {
      canonical: `/help/categorie/${slug}`,
    },
    openGraph: {
      ...parentMeta.openGraph,
      title: category.title,
      description: category.description ?? parentMeta.openGraph?.description,
      url: `/help/categorie/${slug}`,
    },
  };
}

export default async function Page({ params: { slug } }: PageProps) {
  const category = await findCategory(slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              {category.title}
            </h1>
            {category.description ? (
              <p className="text-xl">{category.description}</p>
            ) : null}
          </div>
        </div>
      </PageHero>
      <div className="min-h-72 py-16 lg:py-32 w-full -mb-32 flex flex-col items-center justify-center gap-y-8 container mx-auto px-4 sm:px-6 lg:px-8"></div>
    </main>
  );
}
