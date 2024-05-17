import type { Metadata, ResolvingMetadata } from "next";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import { getHelpFaqs } from "~/lib/article-2";
import PageHero from "../../_components/style/page-hero";
import Breadcrumb from "../_components/breadcrumb";
import Search from "../_components/search";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  {}: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const [parentMeta] = await Promise.all([parent]);

  return {
    title: "Veelgestelde vragen",
    description: "Ontdek antwoorden op veelgestelde vragen.",
    alternates: {
      canonical: `/help/veelgestelde-vragen`,
    },
    openGraph: {
      ...parentMeta.openGraph,
      title: "Veelgestelde vragen",
      description: parentMeta.openGraph?.description,
      url: `/help/veelgestelde-vragen`,
    },
  };
}

export default async function Page() {
  const [questions] = await Promise.all([getHelpFaqs()]);

  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              Veelgestelde vragen
            </h1>
            <p className="text-xl">Ontdek antwoorden op veelgestelde vragen.</p>
          </div>
        </div>
      </PageHero>
      <div className="min-h-72 py-16 lg:py-32 w-full -mb-32 flex flex-col items-center justify-center gap-y-8 container mx-auto px-4 sm:px-6 lg:px-8 md:max-w-3xl">
        <Search />
        <Breadcrumb
          items={[
            { label: "Alle categorieën", href: "/help" },
            {
              label: "Alle vragen",
              href: "/help/veelgestelde-vragen",
            },
          ]}
        />
        <div className="grid break-inside-avoid gap-2 rounded-2xl bg-gray-100 px-6 pt-8 pb-10 w-full">
          {questions.map((question) => (
            <BoxedButton
              key={question.slug}
              href={`/help/veelgestelde-vragen/${question.slug}`}
              className="mt-2 text-branding-dark hover:bg-branding-dark/10 w-full"
            >
              <span className="mr-2">{question.metadata.question}</span>
            </BoxedButton>
          ))}
        </div>
      </div>
    </main>
  );
}
