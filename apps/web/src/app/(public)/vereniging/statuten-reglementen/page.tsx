import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Statuten en Reglementen",
    alternates: {
      canonical: "/vereniging/statuten-reglementen",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Statuten en Reglementen",
      url: "/vereniging/statuten-reglementen",
    },
  };
}
export default function Page() {
  return (
    <article className="prose max-w-prose">
      <div className="prose-lg">
        <p>
          Als vereniging hebben wij statuten opgesteld die de grondslag vormen
          voor onze organisatie. Hierin zijn onder andere de doelstellingen van
          de vereniging vastgelegd, de wijze van benoeming van bestuursleden en
          de wijze van besluitvorming.
        </p>
        <p>
          De statuten zijn vastgesteld op 24 januari 2024 en zijn hieronder te
          downloaden.
        </p>
      </div>

      <div className="not-prose flex w-full justify-center sm:justify-start">
        <Link
          href="/20240124-statuten-nationaal-watersportdiploma.pdf"
          target="_blank"
          className="flex w-fit text-sm items-center gap-2 transition-colors rounded-full bg-branding-light hover:bg-branding-dark px-3.5 py-1.5 text-white"
        >
          <ArrowDownTrayIcon className="size-4" strokeWidth={2} />
          Download Verenigingsstatuten
        </Link>
      </div>
    </article>
  );
}
