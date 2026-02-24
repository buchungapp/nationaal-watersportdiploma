import path from "node:path";
import glob from "fast-glob";
import { cacheLife } from "next/cache";
import type { StaticImageData } from "next/image";
import { cache } from "react";

export type ArticleCategory = "consument" | "achterban" | "vereniging" | "pers";

interface Article {
  title: string;
  category: ArticleCategory;
  date: string;
  description: string;
  featuredImage?: StaticImageData;
}

export interface ArticleWithSlug extends Article {
  id: string;
  slug: string;
}

function assertActueelArticleMetadata(
  value: unknown,
  filename: string,
): asserts value is Article {
  if (!value || typeof value !== "object") {
    throw new Error(`Missing article metadata in ${filename}`);
  }

  const metadata = value as Record<string, unknown>;

  const requiredKeys = ["title", "category", "date", "description"] as const;
  for (const key of requiredKeys) {
    if (typeof metadata[key] !== "string") {
      throw new Error(`Invalid article.${key} in ${filename}`);
    }
  }

  if (
    metadata.category !== "consument" &&
    metadata.category !== "achterban" &&
    metadata.category !== "vereniging" &&
    metadata.category !== "pers"
  ) {
    throw new Error(`Invalid article.category in ${filename}`);
  }
}

async function importArticle(articleFilename: string): Promise<ArticleWithSlug> {
  const mdxModule = (await import(
    /* webpackInclude: /\/page\.mdx$/ */
    `../app/(public)/actueel/(article)/${articleFilename}`
  )) as {
    default: React.ComponentType;
    article?: unknown;
  };

  assertActueelArticleMetadata(mdxModule.article, articleFilename);

  const slug = articleFilename.replace(/\/page.mdx$/, "");

  return {
    ...mdxModule.article,
    // biome-ignore lint/style/noNonNullAssertion: actueel slug always starts with an article id
    id: slug.split("-").at(0)!,
    slug,
  };
}

const getAllArticlesUncached = async () => {
  "use cache";
  cacheLife("days");

  const workingPath = process.cwd();
  const contentPath = "./src/app/(public)/actueel/(article)";
  const articleFilenames = await glob("*/page.mdx", {
    cwd: path.join(workingPath, contentPath),
  });

  const articles = await Promise.all(articleFilenames.map(importArticle));

  return articles.sort((a, z) => +new Date(z.date) - +new Date(a.date));
};

export const getAllArticles = cache(getAllArticlesUncached);

export async function findArticleById(id: string) {
  const articles = await getAllArticles();

  return articles.find((article) => article.id === id);
}
