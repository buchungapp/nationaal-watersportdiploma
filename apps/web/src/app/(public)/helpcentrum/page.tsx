import Link from "next/link";
import { listFaqs as listFaqsGeneral } from "~/lib/faqs";
import { listFaqs as listFaqsDiplomalijn } from "~/lib/faqs-diplomalijn";
import PageHero from "../_components/style/page-hero";
import Search from "./_components/search";

import type { Metadata, ResolvingMetadata } from "next";
import React from "react";
import { getAllHelpArticles } from "~/lib/help-articles";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Helpcentrum",
    description:
      "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
    openGraph: {
      ...parentOpenGraph,
      title: "Helpcentrum",
      description:
        "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
      url: "/helpcentrum",
    },
  };
}

export default async function Page() {
  const [generalQuestions, diplomalijnQuestions, helpArticles] =
    await Promise.all([
      listFaqsGeneral({}),
      listFaqsDiplomalijn({}),
      getAllHelpArticles(),
    ]);

  const combined = [...generalQuestions, ...diplomalijnQuestions];

  // Filter duplicate questions
  const uniqueQuestions = combined.filter(
    (q, idx, arr) => arr.findIndex((q2) => q2.question === q.question) === idx,
  );

  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              Helpcentrum
            </h1>
            <p className="text-xl">
              Ontdek antwoorden op veelgestelde vragen, handige documenten en
              meer.
            </p>
          </div>
        </div>
      </PageHero>
      <div className="min-h-72 py-16 lg:py-32 w-full -mb-32 flex flex-col items-center justify-center gap-y-8 container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold lg:text-3xl xl:text-4xl text-gray-900">
          Hoe kunnen we helpen?
        </h2>
        <Search questions={uniqueQuestions} articles={helpArticles} />
        <p className="text-center mt-4 max-w-prose">
          <span className="font-semibold text-gray-600">Populaire vragen:</span>{" "}
          {generalQuestions
            .filter((q) => !!q.featured)
            .slice(0, 3)
            .map((q, idx) => (
              <React.Fragment key={`${q.categories.join("-")}-${q.slug}`}>
                <Link
                  href={`/helpcentrum/veelgestelde-vragen/${q.categories.join("/")}/${q.slug}`}
                  className="text-gray-500 hover:text-gray-900 underline"
                >
                  {q.question}
                </Link>
                {idx < 2 ? ", " : ""}
              </React.Fragment>
            ))}
        </p>
      </div>
    </main>
  );
}
