import { ArrowRightIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import Image from "next/image";
import { Suspense } from "react";
import { TextButton } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { formatDate } from "~/app/(public)/_utils/format-date";
import { type ArticleCategory, getAllArticles } from "~/lib/articles";

async function NewsContent({ categories }: { categories?: ArticleCategory[] }) {
  const articles = await getAllArticles();

  const filteredArticles = categories
    ? articles.filter((article) => categories.includes(article.category))
    : articles;

  return (
    <ul className="flex flex-col gap-y-2">
      {filteredArticles.slice(0, 2).map((article) => (
        <li key={article.id}>
          <Link
            href={`/actueel/${article.slug}`}
            target="_blank"
            className={clsx(
              "gap-x-3 grid grid-cols-3 data-active:bg-zinc-50 data-hover:bg-zinc-50 rounded-lg",

              // Sizing
              "px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm/6",

              "-mx-[calc(--spacing(3.5)-1px)] -my-[calc(--spacing(2.5)-1px)] sm:-mx-[calc(--spacing(3)-1px)] sm:-my-[calc(--spacing(1.5)-1px)]",

              // Focus
              "focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-branding-light",
            )}
          >
            {article.featuredImage ? (
              <div className="relative rounded aspect-video overflow-hidden">
                <Image
                  src={article.featuredImage.src}
                  blurDataURL={article.featuredImage.blurDataURL}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-y-1.5 col-span-2">
              <h3 className="sm:text-sm/4 text-base/4 text-ellipsis line-clamp-2">
                {article.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 sm:text-xs text-sm">
                {formatDate(article.date)} · {article.category}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function News({
  className,
  categories,
}: {
  className?: string;
  categories?: ArticleCategory[];
}) {
  return (
    <StackedLayoutCard className={className}>
      <Subheading className="mb-3">Blijf op de hoogte</Subheading>
      <Suspense
        fallback={
          <ul className="flex flex-col gap-y-2">
            <li>
              <span className="block bg-gray-200 rounded w-full h-16 animate-pulse" />
            </li>
            <li>
              <span className="block bg-gray-200 rounded w-full h-16 animate-pulse" />
            </li>
          </ul>
        }
      >
        <NewsContent categories={categories} />
      </Suspense>

      <Divider className="my-4" />

      <div className="flex justify-end">
        <TextButton>
          Bekijk nieuwsoverzicht <ArrowRightIcon />
        </TextButton>
      </div>
    </StackedLayoutCard>
  );
}
