import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHelpArticles, getHelpCategories } from "~/lib/article-2";
import Breadcrumb from "../../_components/breadcrumb";

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
  const [category, articles] = await Promise.all([
    findCategory(slug),
    getHelpArticles().then((articles) =>
      articles.filter((x) => x.category === slug),
    ),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Alle categorieën", href: "/help" },
          {
            label: category.title,
            href: `/help/categorie/${slug}`,
          },
        ]}
      />

      <div className="">
        <h1 className="text-3xl font-bold lg:text-4xl xl:text-5xl text-branding-dark">
          {category.title}
        </h1>
        <p className="text-lg/6 text-gray-800 mt-4">{category.description}</p>
      </div>

      <ul className="space-y-3.5 w-full">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/help/artikel/${article.slug}`}
              className="group flex w-full gap-1 justify-between bg-gray-100 hover:bg-branding-dark/10 rounded-2xl px-6 py-4 text-sm transition-colors"
            >
              <div className="mr-2">
                <p className="text-lg/6 text-branding-dark font-semibold">
                  {article.metadata.title}
                </p>
                <p className="text-gray-800 mt-1 font-normal max-w-prose">
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
    </>
  );
}
