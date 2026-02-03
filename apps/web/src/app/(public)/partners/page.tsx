import type { Metadata, ResolvingMetadata } from "next";

import Image from "next/image";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { Prose } from "../_components/prose";
import watersportverbond from "./_assets/watersportverbond.png";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Partners",
    description: "Partijen waarmee het Nationaal Watersportdiploma samenwerkt.",
    alternates: {
      canonical: "/partners",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Partners",
      description:
        "Partijen waarmee het Nationaal Watersportdiploma samenwerkt.",
      url: "/partners",
    },
  };
}

export default function Page() {
  return (
    <main>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">
              Partners
            </h1>
            Partijen waarmee het Nationaal Watersportdiploma samenwerkt.
          </div>
        </div>
      </PageHero>
      <div className="px-6 max-w-prose mx-auto py-20 lg:px-8">
        <Prose>
          <Image
            src={watersportverbond}
            alt=""
            className="max-w-60 h-auto mb-4"
          />
          <h2 className="mt-4!">Watersportverbond</h2>
          <p>
            Het Koninklijk Nederlands Watersportverbond (Watersportverbond)
            waarborgt als autoriteit en licentiehouder binnen de
            watersportsector de kwaliteit van alle watersportopleidingen in
            Nederland, onder andere voor consumenten en instructeurs maar ook
            voor trainers en officials. Met ingang van 2024 werkt het
            Watersportverbond samen met het Nationaal Watersportdiploma (NWD).
          </p>
          <p>
            Het Watersportverbond verzorgt hierbij de licentie en erkenning voor
            de opleidingen van het NWD. Andersom werkt het NWD mee aan het
            verder ontwikkelen van het landschap van watersportopleidingen in
            Nederland.
          </p>
          <p>
            Lees meer op:{" "}
            <a
              href="https://www.watersportverbond.nl"
              target="_blank"
              rel="noreferrer"
            >
              www.watersportverbond.nl
            </a>
            .
          </p>
        </Prose>
      </div>
    </main>
  );
}
