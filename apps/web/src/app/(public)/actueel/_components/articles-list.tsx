import { ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { getAllArticles } from "~/lib/articles";
import Article from "../../_components/style/article";
import { formatDate } from "../../_utils/format-date";

export default async function ArticlesList(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let articles = await getAllArticles();
  const searchParams = await props.searchParams;

  if (searchParams.filter) {
    articles = articles.filter((article) => {
      return Array.isArray(searchParams.filter)
        ? searchParams.filter.includes(article.category)
        : searchParams.filter === article.category;
    });
  }

  return (
    <div className="flex flex-col justify-center gap-16">
      {articles.length < 1 ? (
        <p className="text-2xl text-slate-500">
          Er zijn geen artikelen gevonden.
        </p>
      ) : null}
      {articles.map((article) => (
        <div key={article.slug} className="grid gap-2 sm:grid-cols-[12rem_1fr]">
          <p className="text-xs text-slate-400">{formatDate(article.date)}</p>

          <Link
            href={`/actueel/${article.slug}`}
            className="-m-4 rounded-3xl p-4 transition-colors hover:bg-slate-100 max-w-xl"
          >
            <Article>
              <Article.Heading className="text-xs text-slate-400">
                {article.category}
              </Article.Heading>
              <Article.Title>{article.title}</Article.Title>
              <Article.Paragraph className="text-slate-700">
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
                  className="size-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </div>
            </Article>
          </Link>
        </div>
      ))}
    </div>
  );
}
