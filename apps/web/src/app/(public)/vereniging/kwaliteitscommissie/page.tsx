import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Kwaliteitscommissie",
    alternates: {
      canonical: "/vereniging/kwaliteitscommissie",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Kwaliteitscommissie",
      url: "/vereniging/kwaliteitscommissie",
    },
  };
}

export default function Page() {
  return (
    <article className="prose max-w-prose">
      <div className="prose-lg">
        <p>
          De kwaliteitscommissie (KC) heeft als doel om de kwaliteit van
          aangeboden activiteiten op de vaarlocaties te borgen en te verbeteren.
          In de KC zitten experts uit de watersportsector, met jarenlange
          ervaring op verschillende locaties. De KC heeft onder meer de volgende
          taken:
        </p>

        <ul>
          <li>
            Het ontwikkelen en bewaken van de inhoud van de kaderopleidingen en
            diploma-eisen voor de consument.
          </li>
          <li>
            Het formuleren van veiligheids en kwaliteitseisen voor vaarlocaties.
          </li>
          <li>
            Het verzorgen van een intake proces van nieuwe vaarlocaties, waarbij
            wordt bekeken of een locatie aan de NWD eisen voldoet.
          </li>
          <li>
            Het controleren van aangesloten vaarlocaties, in samenwerking met
            onafhankelijke controleurs.
          </li>
        </ul>

        <p>
          Daarnaast is de kwaliteitscommissie het belangrijkste adviesorgaan van
          het NWD bestuur op het gebied van technische en kwaliteitszaken. De KC
          wordt in haar werkzaamheden ondersteund door het{" "}
          <Link href="/vereniging/secretariaat">secretariaat</Link>.
        </p>

        <p>
          Voor de kwaliteitseisen die gesteld worden aan vaarlocaties verwijzen
          we je naar de{" "}
          <Link href="/vaarlocaties/kwaliteitseisen">kwaliteitseisen</Link>.
        </p>
      </div>
    </article>
  );
}
