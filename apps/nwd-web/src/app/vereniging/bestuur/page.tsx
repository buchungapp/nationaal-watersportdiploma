import Link from "next/link";

export default function Bestuur() {
  return (
    <article className="prose">
      <div className="prose-lg">
        <h3>Bestuur</h3>
        <p>
          Het bestuur van de vereniging Nationaal Watersportdiploma bestaat uit vijf natuurlijke
          personen. Het verenigingsbestuur bestaat uit een voorzitter, een vicevoorzitter, een
          secretaris, een penningmeester en een algemeen bestuurslid. Het bestuur verdeelt in
          onderling overleg de functie en de werkzaamheden.
        </p>
      </div>
      <p>
        Alle bestuursfuncties bij het Nationaal Watersportdiploma betreffen vrijwilligersfuncties en
        zijn naast een eventuele onkostenvergoeding onbezoldigd.
      </p>

      <p>
        <strong>Jeroen Wolthuis</strong>
        <br />
        Voorzitter
        <br />
        Contact via{" "}
        <Link href="mailto:voorzitter@nationaalwatersportdiploma.nl">
          voorzitter
          <wbr />
          @nationaalwatersportdiploma.nl
        </Link>
      </p>

      <p>
        <strong>Wytse Buis</strong>
        <br />
        Secretaris
        <br />
        Contact via{" "}
        <Link href="mailto:secretaris@nationaalwatersportdiploma.nl" className="break-words">
          secretaris
          <wbr />
          @nationaalwatersportdiploma.nl
        </Link>
      </p>

      <p>
        <strong>Sebastiaan Sargis</strong>
        <br />
        Penningmeester
        <br />
        Contact via{" "}
        <Link href="mailto:penningmeester@nationaalwatersportdiploma.nl" className="break-words">
          penningmeester
          <wbr />
          @nationaalwatersportdiploma.nl
        </Link>
      </p>

      <p>
        <strong>Thom Hoff</strong>
        <br />
        Algemeen bestuurslid & vicevoorzitter
        <br />
        Contact via{" "}
        <Link href="mailto:vicevoorzitter@nationaalwatersportdiploma.nl" className="break-words">
          vicevoorzitter
          <wbr />
          @nationaalwatersportdiploma.nl
        </Link>
      </p>

      <p>
        <strong>Sjoerd Feith</strong>
        <br />
        Algemeen bestuurslid
        <br />
        Contact via{" "}
        <Link
          href="mailto:algemeen.bestuurslid@nationaalwatersportdiploma.nl"
          className="break-words"
        >
          algemeen.bestuurslid
          <wbr />
          @nationaalwatersportdiploma.nl
        </Link>
      </p>
    </article>
  );
}
