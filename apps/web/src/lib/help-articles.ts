import glob from "fast-glob";
import path from "path";

interface HelpArticle {
  title: string;
  date: string;
  description: string;
}

export interface HelpArticleWithSlug extends HelpArticle {
  id: string;
  slug: string;
}

async function importHelpArticle(
  articleFilename: string,
): Promise<HelpArticleWithSlug> {
  const { article } = (await import(
    `../app/(public)/helpcentrum/artikels/(article)/${articleFilename}`
  )) as {
    default: React.ComponentType;
    article: HelpArticle;
  };

  const slug = articleFilename.replace(/\/page.mdx$/, "");

  return {
    id: slug.split("-").at(0)!,
    slug,
    ...article,
  };
}

export async function getAllHelpArticles() {
  const workingPath = process.cwd();
  const contentPath = "./src/app/(public)/helpcentrum/artikels/(article)";
  const articleFilenames = await glob("*/page.mdx", {
    cwd: path.join(workingPath, contentPath),
  });

  const articles = await Promise.all(articleFilenames.map(importHelpArticle));

  return articles.sort((a, z) => +new Date(z.date) - +new Date(a.date));
}

export async function findHelpArticleById(id: string) {
  const articles = await getAllHelpArticles();

  return articles.find((article) => article.id === id);
}
