import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { constants } from "@nawadi/lib";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "~/app/(public)/_components/prose";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { listFaqs as listFaqsGeneral } from "~/lib/faqs";
import { listFaqs as listFaqsDiplomalijn } from "~/lib/faqs-diplomalijn";

// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
  const [faqsGeneral, faqsDiplomalijn] = await Promise.all([
    listFaqsGeneral(),
    listFaqsDiplomalijn(),
  ]);

  return [...faqsGeneral, ...faqsDiplomalijn].map((faq) => ({
    faq: [...faq.categories, faq.slug],
  }));
}

async function findQuestion(type: string, category: string, slug: string) {
  const allQuestions = await Promise.all([
    listFaqsGeneral(),
    listFaqsDiplomalijn(),
  ]).then(([general, diplomalijn]) => [...general, ...diplomalijn]);

  return allQuestions.find(
    (q) =>
      q.categories[0] === type &&
      q.categories[1] === category &&
      q.slug === slug,
  );
}

interface Props {
  params: { faq: string[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const question = await findQuestion(
    params.faq[0]!,
    params.faq[1]!,
    params.faq[2]!,
  );

  if (!question) {
    notFound();
  }

  return {
    title: `${question.question}`,
    alternates: {
      canonical: `/help/veelgestelde-vragen/${params.faq.join("/")}`,
    },
    openGraph: {
      title: `${question.question}`,
      type: "article",
      url: `/help/veelgestelde-vragen/${params.faq.join("/")}`,
    },
  };
}
export default async function Page({ params }: Props) {
  const question = await findQuestion(
    params.faq[0]!,
    params.faq[1]!,
    params.faq[2]!,
  );

  if (!question) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: question.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: question.answer,
                },
              },
            ],
            url: `${constants.WEBSITE_URL}/help/veelgestelde-vragen/${params.faq.join("/")}`,
          }),
        }}
      />

      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">
              {question.question}
            </h1>
          </div>
        </div>
      </PageHero>
      <div className="container max-w-prose text-lg mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <span className="font-semibold text-base text-gray-600">Antwoord:</span>
        <Prose dangerouslySetInnerHTML={{ __html: question.answer }} />

        <Link
          href={"/contact"}
          className="flex items-center mt-16 transition-colors lg:mt-24 text-base w-fit mx-auto px-6 py-4 bg-branding-light/10 hover:bg-branding-light/30 rounded-2xl text-gray-700"
        >
          <div>
            <h3 className="font-semibold">Vraag niet beantwoord?</h3>
            <p className="">Neem contact op met het secretariaat!</p>
          </div>
          <ChevronRightIcon className="h-6 w-6 ml-6 text-gray-500" />
        </Link>
      </div>
    </>
  );
}
