import clsx from "clsx";
import Link from "next/link";
import { Suspense } from "react";
import { getAllArticles } from "~/lib/articles";

async function LatestNewsList() {
  const articles = await getAllArticles();

  return (
    <ul role="list" className="mt-2 -mx-1.5 space-y-0.5">
      {articles.slice(0, 3).map((article) => (
        <li key={article.id}>
          <Link
            href={`/actueel/${article.slug}`}
            target="_blank"
            title={article.title}
            className={clsx(
              "text-sm leading-6 py-1 rounded px-1.5 hover:bg-gray-50 font-semibold text-gray-700 line-clamp-1",
            )}
          >
            {article.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function LatestNews() {
  return (
    <Suspense fallback={null}>
      <LatestNewsList />
    </Suspense>
  );
}
