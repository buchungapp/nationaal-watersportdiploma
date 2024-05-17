import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { constants } from "@nawadi/lib";
import { marked } from "marked";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Prose } from "~/app/(public)/_components/prose";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { formatDate } from "~/app/(public)/_utils/format-date";
import { Container } from "~/app/(public)/actueel/(article)/_components/container";
import { getHelpFaqs } from "~/lib/article-2";
import { HelpArticle } from "../../_components/article";

// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
  const allQuestions = await getHelpFaqs();

  return allQuestions.map((faq) => ({
    slug: [faq.slug],
  }));
}

async function findQuestion(slug: string) {
  const allQuestions = await getHelpFaqs();

  return allQuestions.find((q) => q.slug === slug);
}

interface Props {
  params: { slug: string[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.slug.length !== 1) {
    redirect("/help/veelgestelde-vragen");
  }

  const question = await findQuestion(params.slug[0]!);

  if (!question) {
    notFound();
  }

  return {
    title: `${question.metadata.question}`,
    alternates: {
      canonical: `/help/veelgestelde-vragen/${question.slug}`,
    },
    openGraph: {
      title: `${question.metadata.question}`,
      type: "article",
      url: `/help/veelgestelde-vragen/${question.slug}`,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(question.metadata.question)}`,
          width: 1200,
          height: 630,
          alt: question.metadata.question,
        },
      ],
    },
  };
}

export default async function Page({ params }: Props) {
  if (params.slug.length !== 1) {
    redirect("/help/veelgestelde-vragen");
  }

  const question = await findQuestion(params.slug[0]!);

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
                name: question.metadata.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: marked.parse(question.content),
                },
              },
            ],
            url: `${constants.WEBSITE_URL}/help/veelgestelde-vragen/${question.slug}`,
          }),
        }}
      />

      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="text-3xl font-bold lg:text-4xl xl:text-5xl">
              {question.metadata.question}
            </h1>
          </div>
        </div>
      </PageHero>
      <Container className="mt-12 lg:mt-16">
        <div className="mx-auto max-w-2xl">
          <article className="flex flex-col gap-y-10">
            <div className="flex items-center gap-x-4 text-gray-400">
              <span className="h-4 w-0.5 rounded-full bg-zinc-200"></span>
              <span className="flex gap-x-1.5">
                <p>Laatste update</p>

                <time
                  className="font-medium"
                  dateTime={question.metadata.lastUpdatedAt}
                >
                  {formatDate(question.metadata.lastUpdatedAt)}
                </time>
              </span>
            </div>

            <Prose data-mdx-content>
              <span className="font-semibold text-base text-gray-600">
                Antwoord:
              </span>
              <HelpArticle source={question.content} />
            </Prose>
          </article>

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
      </Container>
    </>
  );
}
