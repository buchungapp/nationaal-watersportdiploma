import { getHelpArticles, getHelpFaqs } from "~/lib/help-content";
import SearchClient from "./search-client";

export default async function Search() {
  const [questions, articles] = await Promise.all([
    getHelpFaqs(),
    getHelpArticles(),
  ]);

  return (
    <SearchClient
      questions={questions.map((question) => ({
        metadata: question.metadata,
        slug: question.slug,
      }))}
      articles={articles.map((article) => ({
        category: article.category,
        metadata: article.metadata,
        slug: article.slug,
      }))}
    />
  );
}
