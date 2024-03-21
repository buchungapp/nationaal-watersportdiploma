import Link from "next/link";
import { listFaqs } from "~/lib/faqs";
import PageHero from "../_components/style/page-hero";
import Search from "./_components/search";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helpcentrum",
  description:
    "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
};

export default async function Page() {
  const questions = await listFaqs({});

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
        <Search questions={questions} />
        <p className="text-center mt-4 max-w-prose">
          <span className="font-semibold text-gray-600">Populaire vragen:</span>{" "}
          {questions
            .filter((q) => !!q.featured)
            .slice(0, 3)
            .map((q, idx) => (
              <>
                <Link
                  key={`${q.category}-${q.slug}`}
                  href={`/helpcentrum/veelgestelde-vragen/${q.category}/${q.slug}`}
                  className="text-gray-500 hover:text-gray-900 underline"
                >
                  {q.question}
                </Link>
                {idx < 2 ? ", " : ""}
              </>
            ))}
        </p>
      </div>
    </main>
  );
}
