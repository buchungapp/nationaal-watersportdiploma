import CopyToClipboard from "~/app/_components/style/copy-to-clipboard";

export default function Page() {
  return (
    <article className="prose max-w-prose">
      <div className="prose-lg">
        <p>
          Het bestuur van de vereniging Nationaal Watersportdiploma bestaat uit
          vijf natuurlijke personen. Het verenigingsbestuur bestaat uit een
          voorzitter, een vicevoorzitter, een secretaris, een penningmeester en
          een algemeen bestuurslid. Het bestuur verdeelt in onderling overleg de
          functie en de werkzaamheden.
        </p>
      </div>
      <p>
        Alle bestuursfuncties bij het Nationaal Watersportdiploma betreffen
        vrijwilligersfuncties en zijn naast een eventuele onkostenvergoeding
        onbezoldigd.
      </p>

      <p>
        <strong>Jeroen Wolthuis</strong>
        <br />
        Voorzitter
        <br />
        Contact via{" "}
        <CopyToClipboard
          value="voorzitter@nationaalwatersportdiploma.nl"
          className="break-words underline"
        >
          voorzitter
          <wbr />
          @nationaalwatersportdiploma.nl
        </CopyToClipboard>
      </p>

      <p>
        <strong>Wytse Buis</strong>
        <br />
        Secretaris
        <br />
        Contact via{" "}
        <CopyToClipboard
          value="secretaris@nationaalwatersportdiploma.nl"
          className="break-words underline"
        >
          secretaris
          <wbr />
          @nationaalwatersportdiploma.nl
        </CopyToClipboard>
      </p>

      <p>
        <strong>Sebastiaan Sargis</strong>
        <br />
        Penningmeester
        <br />
        Contact via{" "}
        <CopyToClipboard
          value="penningmeester@nationaalwatersportdiploma.nl"
          className="break-words underline"
        >
          penningmeester
          <wbr />
          @nationaalwatersportdiploma.nl
        </CopyToClipboard>
      </p>

      <p>
        <strong>Thom Hoff</strong>
        <br />
        Algemeen bestuurslid & vicevoorzitter
        <br />
        Contact via{" "}
        <CopyToClipboard
          value="vicevoorzitter@nationaalwatersportdiploma.nl"
          className="break-words underline"
        >
          vicevoorzitter
          <wbr />
          @nationaalwatersportdiploma.nl
        </CopyToClipboard>
      </p>

      <p>
        <strong>Sjoerd Feith</strong>
        <br />
        Algemeen bestuurslid
        <br />
        Contact via{" "}
        <CopyToClipboard
          value="algemeen.bestuurslid@nationaalwatersportdiploma.nl"
          className="break-words underline"
        >
          algemeen.bestuurslid
          <wbr />
          @nationaalwatersportdiploma.nl
        </CopyToClipboard>
      </p>
    </article>
  );
}
