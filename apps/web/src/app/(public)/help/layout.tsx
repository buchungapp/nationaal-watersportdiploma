"use cache";
import { cacheLife } from "next/cache";
import PageHero from "../_components/style/page-hero";
import SearchClient from "./_components/search-client";

import type { PropsWithChildren } from "react";
import { getHelpArticles, getHelpFaqs } from "~/lib/article-2";

export default async function Layout({ children }: PropsWithChildren) {
  cacheLife("days");

  const [questions, articles] = await Promise.all([
    getHelpFaqs(),
    getHelpArticles(),
  ]);

  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="max-w-5xl w-full container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold lg:text-4xl xl:text-5xl text-white">
            Hoe kunnen we helpen?
          </h2>
          <div className="mt-6">
            <SearchClient questions={questions} articles={articles} />
          </div>
        </div>
      </PageHero>
      <div className="min-h-72 pt-16 pb-16 lg:pb-32 w-full -mb-32 flex flex-col gap-y-8 container overflow-x-hidden mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {children}
      </div>
    </main>
  );
}
