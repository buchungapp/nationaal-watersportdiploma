import PageHero from "../_components/style/page-hero";
import SearchClient from "./_components/search-client";

import { PropsWithChildren } from "react";
import { getHelpArticles, getHelpFaqs } from "~/lib/article-2";

export default async function Layout({ children }: PropsWithChildren) {
  const [questions, articles] = await Promise.all([
    getHelpFaqs(),
    getHelpArticles(),
  ]);

  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16 max-w-screen-lg w-full mx-auto">
          <h2 className="text-3xl font-bold lg:text-4xl xl:text-5xl text-white">
            Hoe kunnen we helpen?
          </h2>
          <div className="mt-6">
            <SearchClient questions={questions} articles={articles} />
          </div>
        </div>
      </PageHero>
      {children}
    </main>
  );
}
