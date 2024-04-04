import type { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  _props: unknown,
  parent?: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent)?.openGraph;

  return {
    title: "Manifest",
    openGraph: {
      ...parentOpenGraph,
      title: "Manifest",
      url: "/vereniging/manifest",
    },
  };
}
export default function Page() {
  return (
    <article className="prose max-w-prose">
      <div className="prose-lg">
        <p>
          De afgelopen jaren hebben de leidende zeilscholen van Nederland,
          verenigd door een gedeelde visie op vooruitgang, elkaar steeds vaker
          opgezocht. Samen zijn we overtuigd dat het nu tijd is om de lat hoger
          te leggen en actief te blijven doorontwikkelen om de toekomst van de
          watersport te vormen.
        </p>
      </div>

      <p>
        Het resultaat is het Nationaal Watersportdiploma (NWD). Met een scherpe
        focus op veiligheid, kwaliteit en plezier voor elke watersporter,
        overstijgt het NWD de traditionele functie van een keurmerk of
        diplomalijn.
      </p>

      <h2>Veiligheid voorop.</h2>
      <p>
        Veiligheid is allesomvattend binnen het NWD: van de standaarduitrusting,
        tot een breed spectrum aan persoonlijke en sociale veiligheid. Elke
        aangesloten locatie voldoet niet alleen aan essentiële veiligheidseisen,
        maar schept ook een omgeving waarin iedereen zich welkom en veilig
        voelt. De inzet van een vertrouwenspersoon en een gedragscode, die
        jaarlijks door alle betrokkenen wordt ondertekend, versterkt onze
        toewijding aan een veilige, respectvolle watersportgemeenschap.
      </p>

      <h2>Kwaliteit als basis.</h2>
      <p>
        Kwaliteit toont zich in verschillende facetten: van het gebruik van goed
        onderhouden en moderne materialen, tot de aanwezigheid van
        hooggekwalificeerde instructeurs die regelmatig bijscholing ontvangen.
        We bevorderen een cultuur van constante verbetering, waarbij locaties
        materiaal uitwisselen, gezamenlijke trainingsdagen organiseren, en
        elkaar uitdagen om de beste in de branche te zijn.
      </p>

      <h2>Plezier staat centraal.</h2>
      <p>
        Plezier staat centraal in alles wat we doen. We geloven dat succes in de
        watersport niet alleen wordt gemeten aan je behaalde vaardigheden of
        diploma&apos;s, maar vooral aan het plezier dat je ervaart. Onze
        diplomalijn is ontworpen om duidelijke stappen en realistische doelen te
        bieden, waarbij ondersteuning altijd binnen handbereik is en elk
        succesmoment wordt gevierd.
      </p>

      <h2>Technologie als ruggengraat.</h2>
      <p>
        Technologie is de ruggengraat die zorgt voor een vlekkeloze ervaring op
        en naast het water, zowel voor watersporters als voor instructeurs en
        vaarlocaties. Het NWD verzorgt het technisch fundament en stimuleert de
        ontwikkeling van eigen innovatieve toepassingen.
      </p>
      <p>
        Het NWD erkent de rijke diversiteit binnen de watersportwereld, van
        verenigingen en scoutinggroepen tot professionele vaarscholen. Actief
        voorlichten van consumenten over alle beschikbare mogelijkheden, zowel
        online als offline, helpt iedereen hun perfecte match te vinden. Ons
        netwerk van ervaren en gepassioneerde professionals staat garant voor
        een toekomst waarin kwaliteit, veiligheid en plezier centraal staan.
      </p>

      <p>
        <strong>
          Wij zijn het Nationaal Watersportdiploma. Ontwikkel je vaardigheden op
          het water, veilig en vol plezier!
        </strong>
      </p>
    </article>
  );
}
