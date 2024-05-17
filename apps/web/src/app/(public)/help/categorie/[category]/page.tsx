import type { Metadata, ResolvingMetadata } from "next";
import PageHero from "../../../_components/style/page-hero";

type PageProps = {
  params: {
    category: string;
  };
};

export async function generateMetadata(
  { params: { category } }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Helpcentrum",
    description:
      "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
    alternates: {
      canonical: "/help",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Helpcentrum",
      description:
        "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
      url: `/help/categorie/${category}`,
    },
  };
}

export default async function Page({ params: { category } }: PageProps) {
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
      <div className="min-h-72 py-16 lg:py-32 w-full -mb-32 flex flex-col items-center justify-center gap-y-8 container mx-auto px-4 sm:px-6 lg:px-8"></div>
    </main>
  );
}
