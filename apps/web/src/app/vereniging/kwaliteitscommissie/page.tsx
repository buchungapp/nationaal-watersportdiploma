import Link from "next/link";

export default function Page() {
  return (
    <article className="prose max-w-prose">
      <div className="prose-lg">
        <p>
          Het secretariaat van het Nationaal Watersportdiploma vervult de
          centrale rol in de communicatie en operationele uitvoering. Het is het
          primaire aanspreekpunt voor instructeurs, leden, aspirant-leden,
          leveranciers, consumenten, pers en overige relaties.
        </p>
        <p>
          Het secretariaat werkt onder toezicht van het bestuur en wordt
          momenteel gerund door Maurits Misana. Voor contact met het
          secretariaat kijk je op de <Link href="/contact">contactpagina</Link>.
        </p>
      </div>
    </article>
  );
}
