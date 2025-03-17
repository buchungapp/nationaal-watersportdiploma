import type { Metadata, ResolvingMetadata } from "next";
import PageHero from "../_components/style/page-hero";
import CashbackForm from "./_components/cashback-form";
import CashbackHow from "./_components/cashback-how";
import CashbackWelcome from "./_components/cashback-welcome";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Cashback",
    description: "@TODO: update description",
    alternates: {
      canonical: "/cashback",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Cashback",
      description: "@TODO: update description",
      url: "/cashback",
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
    </main>
  );
}
