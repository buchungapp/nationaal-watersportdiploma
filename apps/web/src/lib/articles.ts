import glob from "fast-glob";
import type { StaticImageData } from "next/image";
import path from "path";
import { HAVE_WE_LAUNCHED } from "../../launch-control";

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

async function importArticle(
  articleFilename: string,
): Promise<ArticleWithSlug> {
  const { article } = (await import(
    `../app/actueel/(article)/${articleFilename}`
  )) as {
    default: React.ComponentType;
    article: Article;
  };

  const slug = articleFilename.replace(/\/page.mdx$/, "");

  return {
    id: slug.split("-").at(0)!,
    slug,
    ...article,
  };
}

export async function getAllArticles() {
  // 🚀 launch control
  if (!HAVE_WE_LAUNCHED) return [];

  const workingPath = process.cwd();
  const contentPath = "./src/app/actueel/(article)";
  const articleFilenames = await glob("*/page.mdx", {
    cwd: path.join(workingPath, contentPath),
  });

  const articles = await Promise.all(articleFilenames.map(importArticle));

  return articles.sort((a, z) => +new Date(z.date) - +new Date(a.date));
}

export async function findArticleById(id: string) {
  const articles = await getAllArticles();

  return articles.find((article) => article.id === id);
}
