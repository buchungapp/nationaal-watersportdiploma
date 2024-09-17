import { getHelpArticles } from "~/lib/article-2";
import SearchClient from "./search-client";

export default async function Search() {
  const [articles] = await Promise.all([getHelpArticles()]);

  return <SearchClient articles={articles} />;
}
