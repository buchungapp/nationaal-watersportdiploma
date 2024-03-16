import glob from "fast-glob";

interface Article {
  title: string;
  description: string;
  date: string;
}

export interface ArticleWithSlug extends Article {
  id: string;
  slug: string;
}

async function importArticle(
  articleFilename: string,
): Promise<ArticleWithSlug> {
  const { article } = (await import(`../app/actueel/${articleFilename}`)) as {
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
  const articleFilenames = await glob("*/page.mdx", {
    cwd: "./src/app/actueel",
  });

  const articles = await Promise.all(articleFilenames.map(importArticle));

  return articles.sort((a, z) => +new Date(z.date) - +new Date(a.date));
}

export async function findArticleById(id: string) {
  const articles = await getAllArticles();

  return articles.find((article) => article.id === id);
}
