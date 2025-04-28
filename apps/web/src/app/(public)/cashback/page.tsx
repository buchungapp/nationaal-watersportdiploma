import type { Metadata, ResolvingMetadata } from "next";
import PageHero from "../_components/style/page-hero";
import CashbackConditions from "./_components/cashback-conditions";
import CashbackFaq from "./_components/cashback-faq";
import CashbackForm from "./_components/cashback-form";
import CashbackHow from "./_components/cashback-how";
import CashbackWelcome from "./_components/cashback-welcome";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "€50 cashback bij inlevering van je CWO-diploma!",
    description:
      "De diplomalijn van het Nationaal Watersportdiploma wordt de nieuwe landelijke standaard, en we helpen je graag om deze overstap te maken!",
    alternates: {
      canonical: "/cashback",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "€50 cashback bij inlevering van je CWO-diploma!",
      description:
        "De diplomalijn van het Nationaal Watersportdiploma wordt de nieuwe landelijke standaard, en we helpen je graag om deze overstap te maken!",
      url: "/cashback",
      images: [
        {
          url: "/cashback/opengraph-image.jpeg",
          width: 1200,
          height: 630,
          alt: "€50 cashback bij inlevering van je CWO-diploma!",
        },
      ],
    },
  };
}

export default function Cashback() {
  return (
    <main className="flex flex-col items-center gap-24">
      <PageHero>
        <CashbackWelcome />
      </PageHero>
      <CashbackHow />
      <CashbackForm />
      <CashbackConditions />
      <CashbackFaq />
    </main>
  );
}
