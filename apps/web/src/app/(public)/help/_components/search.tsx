import { getHelpArticles, getHelpFaqs } from "~/lib/article-2";
import SearchClient from "./search-client";

export default async function Search() {
  const [questions, articles] = await Promise.all([
    getHelpFaqs(),
    getHelpArticles(),
  ]);

  return <SearchClient questions={questions} articles={articles} />;
}
