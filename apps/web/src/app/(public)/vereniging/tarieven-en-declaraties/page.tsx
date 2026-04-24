import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import CopyToClipboard from "~/app/(public)/_components/style/copy-to-clipboard";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Tarieven en declaraties",
    alternates: {
      canonical: "/vereniging/tarieven-en-declaraties",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Tarieven en declaraties",
      url: "/vereniging/tarieven-en-declaraties",
    },
  };
}

export default function Page() {
  return (
    <article className="prose max-w-prose [&_table]:w-full [&_table]:table-fixed [&_td:last-child]:w-[11rem] [&_th:last-child]:w-[11rem] [&_td:last-child]:tabular-nums">
      <div className="prose-lg">
        <p>
          Het Nationaal Watersportdiploma is een vereniging die draait op de
          inzet van vrijwilligers, externe beoordelaars en commissieleden. Voor
          activiteiten waarbij hun tijd, reizen en expertise structureel worden
          ingezet, hanteert het NWD vaste, transparante vergoedingen — en
          evengoed transparante kosten richting locaties die deze activiteiten
          afnemen.
        </p>
      </div>

      <p>
        Op deze pagina vind je eerst hoe je je vergoeding declareert, en
        daarna alle tarieven overzichtelijk bij elkaar:
      </p>

      <ul>
        <li>
          <Link href="#declaraties">Declaraties indienen</Link> — hoe en waar
          dien je je vergoeding en reiskosten in?
        </li>
        <li>
          <Link href="#vergoedingen">
            Vergoedingen voor vrijwilligers en uitvoerders
          </Link>{" "}
          — wat krijg je voor een PvB-afname, controlebezoek, intake of
          leercoach-bezoek?
        </li>
        <li>
          <Link href="#locaties">Kosten voor aangesloten locaties</Link> —
          jaarbijdrage, kosten per diploma, NWD-materialen, PvB, hercontrole
          en aansluiting.
        </li>
        <li>
          <Link href="#opleidingen">Opleidingskosten voor deelnemers</Link> —
          wat kost het om zelf een NWD-opleiding te volgen?
        </li>
      </ul>

      <blockquote>
        <p>
          Reiskosten worden in alle gevallen uniform vergoed met{" "}
          <strong>€0,21 per kilometer</strong> of werkelijke OV-kosten. Kosten
          voor locaties en deelnemers zijn <strong>exclusief btw</strong>;
          vergoedingen aan vrijwilligers en uitvoerders zijn
          onkostenvergoedingen en bevatten geen btw.
        </p>
      </blockquote>

      <h2 id="declaraties">Declaraties indienen</h2>
      <p>
        Vergoedingen en reiskosten dien je achteraf in bij de penningmeester
        via{" "}
        <CopyToClipboard
          value="penningmeester@nationaalwatersportdiploma.nl"
          className="break-words underline"
        >
          penningmeester
          <wbr />
          @nationaalwatersportdiploma.nl
        </CopyToClipboard>
        . Vermeld in je declaratie:
      </p>
      <ul>
        <li>de verrichte activiteit (rol en context);</li>
        <li>de datum én de vaarlocatie waar de activiteit plaatsvond;</li>
        <li>de gemaakte reiskosten (kilometers of OV-kosten);</li>
        <li>je IBAN en de tenaamstelling van de rekening.</li>
      </ul>

      <h2 id="vergoedingen">Vergoedingen voor vrijwilligers en uitvoerders</h2>
      <p>
        Het NWD werkt met onafhankelijke externen en vrijwilligers die taken
        uitvoeren voor de vereniging. Tegenover hun tijd en expertise staan
        vaste vergoedingen die voor iedereen gelijk zijn, ongeacht voor welke
        locatie wordt gewerkt.
      </p>

      <h3>PvB-beoordelaar</h3>
      <p>
        Als{" "}
        <Link href="/actueel/Tm4kP9wQ-rollen-binnen-het-nwd-transparant-over-onze-kwaliteitspoules">
          PvB-beoordelaar
        </Link>{" "}
        neem je Proeven van Bekwaamheid af voor kandidaat-instructeurs,
        -leercoaches of -beoordelaars. Een PvB omvat een praktijkbeoordeling en,
        afhankelijk van het niveau, één of meer portfolio-onderdelen.
      </p>
      <table>
        <thead>
          <tr>
            <th>Onderdeel</th>
            <th>Vergoeding</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Losse PvB-afname (praktijk plus portfolio&apos;s)</td>
            <td>
              <strong>€100</strong>
            </td>
          </tr>
          <tr>
            <td>Clusteraanvraag — dagtarief</td>
            <td>
              <strong>€150</strong> per dag
            </td>
          </tr>
          <tr>
            <td>Reiskosten</td>
            <td>€0,21/km of OV</td>
          </tr>
        </tbody>
      </table>
      <p>
        Een <strong>clusteraanvraag</strong> betreft meerdere praktijk-PvB&apos;s
        op dezelfde dag en locatie. Het dagtarief van €150 geldt voor de hele
        dag, ongeacht het aantal afnames.
      </p>

      <h3>Controleur</h3>
      <p>
        Als{" "}
        <Link href="/actueel/Tm4kP9wQ-rollen-binnen-het-nwd-transparant-over-onze-kwaliteitspoules">
          controleur
        </Link>{" "}
        bezoek je aangesloten locaties voor een periodieke of herhalingscontrole.
        Je beoordeelt de operationele organisatie ter plaatse en levert een
        rapportage met advies aan het bestuur.
      </p>
      <table>
        <thead>
          <tr>
            <th>Onderdeel</th>
            <th>Vergoeding</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Controlebezoek</td>
            <td>
              <strong>€150</strong>
            </td>
          </tr>
          <tr>
            <td>Rapportage en advies</td>
            <td>
              <strong>€150</strong>
            </td>
          </tr>
          <tr>
            <td>Reiskosten</td>
            <td>€0,21/km of OV</td>
          </tr>
        </tbody>
      </table>

      <h3>Kwaliteitscommissielid</h3>
      <p>
        Als lid van de{" "}
        <Link href="/vereniging/kwaliteitscommissie">Kwaliteitscommissie</Link>{" "}
        voer je intakebezoeken uit bij aspirant-locaties, toets je of een
        locatie aan de NWD-eisen voldoet, en adviseer je het bestuur over
        toelating.
      </p>
      <table>
        <thead>
          <tr>
            <th>Onderdeel</th>
            <th>Vergoeding</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fysieke afspraak en voorbereiding</td>
            <td>
              <strong>€150</strong>
            </td>
          </tr>
          <tr>
            <td>Rapportage en advies</td>
            <td>
              <strong>€150</strong>
            </td>
          </tr>
          <tr>
            <td>Reiskosten</td>
            <td>€0,21/km of OV</td>
          </tr>
        </tbody>
      </table>

      <h3>Leercoach</h3>
      <p>
        Als externe leercoach begeleid je deelnemers aan de centraal
        georganiseerde <strong>niveau&nbsp;5-opleiderscursus</strong>{" "}
        (Leercoach&nbsp;5 of Beoordelaar&nbsp;5) met plaatsbezoeken voor
        observatie, feedback en reflectie. De vergoeding hieronder geldt
        voor bezoeken vanuit die cursus — niet voor begeleiding die een
        vaarlocatie zelf inzet bij lagere niveaus.
      </p>
      <table>
        <thead>
          <tr>
            <th>Onderdeel</th>
            <th>Vergoeding</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bezoek (dagtarief)</td>
            <td>
              <strong>€100</strong> per dag
            </td>
          </tr>
          <tr>
            <td>Reiskosten</td>
            <td>€0,21/km of OV</td>
          </tr>
        </tbody>
      </table>

      <h3>Bestuur en commissies</h3>
      <p>
        Het lidmaatschap van het{" "}
        <Link href="/vereniging/bestuur">bestuur</Link> of een commissie binnen
        het NWD is op zichzelf onbezoldigd: voor deelname aan vergaderingen,
        reguliere beraadslagingen en advieswerk ontvang je uitsluitend een
        onkostenvergoeding. Zo blijft de verenigingsstructuur betaalbaar en
        houden we bestuurlijke posities zuiver vrijwilligerswerk.
      </p>
      <p>
        Voor specifieke uitvoerende taken namens een commissie — bijvoorbeeld
        een intakebezoek van een kwaliteitscommissielid — gelden wél de vaste
        vergoedingen zoals hierboven per rol vermeld. Je krijgt dus geen
        vergoeding omdat je in een commissie zit, maar wel voor het concrete
        werk dat je vanuit die rol uitvoert.
      </p>

      <h2 id="locaties">Kosten voor aangesloten locaties</h2>
      <p>
        Aangesloten locaties betalen jaarlijks een vaste bijdrage aan de
        vereniging. Daarbovenop gelden gebruiksafhankelijke kosten: je betaalt
        alleen voor wat je daadwerkelijk afneemt, zoals PvB&apos;s, uitgegeven
        diploma&apos;s of een hercontrole. Zo blijven de vaste lasten laag en
        is de rekening voorspelbaar.
      </p>

      <h3>Jaarlijkse bijdrage</h3>
      <p>
        De jaarlijkse bijdrage is de basis voor elk lidmaatschap en dekt het
        reguliere werk van de vereniging: kwaliteitscontroles,
        platformontwikkeling, secretariaat, en gezamenlijke belangenbehartiging.
        De contributie is gestaffeld naar omzet uit zeilcursussen en -kampen;
        marketingbijdrage en KNWV-lidmaatschap zijn gelijk voor alle locaties.
      </p>
      <table>
        <thead>
          <tr>
            <th>Onderdeel</th>
            <th>Tarief per jaar</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Contributie — omzet zeilcursussen/-kampen onder €100.000</td>
            <td>
              <strong>€650</strong>
            </td>
          </tr>
          <tr>
            <td>Contributie — omzet zeilcursussen/-kampen vanaf €100.000</td>
            <td>
              <strong>€1.000</strong>
            </td>
          </tr>
          <tr>
            <td>
              Verplichte marketingbijdrage (foto- en videomateriaal,
              promotieacties, advertenties)
            </td>
            <td>
              <strong>€500</strong>
            </td>
          </tr>
          <tr>
            <td>Bijzonder lidmaatschap Watersportverbond (KNWV)</td>
            <td>
              <strong>€450</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Per uitgegeven diploma</h3>
      <p>
        Voor elk diploma dat op jouw locatie wordt uitgegeven, draag je bij
        aan de kosten van de digitale registratie en het fysieke
        diplomapapier.
      </p>
      <table>
        <thead>
          <tr>
            <th>Onderdeel</th>
            <th>Tarief per diploma</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Digitale diplomaregistratie</td>
            <td>
              <strong>€3,00</strong>
            </td>
          </tr>
          <tr>
            <td>Voorbedrukt diplomapapier</td>
            <td>
              <strong>€0,35</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>NWD-materialen</h3>
      <p>
        Bij aansluiting ontvangt elke nieuwe locatie een startpakket met twee
        NWD-vlaggen en één gevelschild. Die zitten in de eenmalige
        intakekosten. Heb je extra vlaggen nodig, bijvoorbeeld voor een tweede
        steiger of een vervanging, dan bestel je die tegen kostprijs bij.
      </p>
      <table>
        <thead>
          <tr>
            <th>Onderdeel</th>
            <th>Tarief</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>NWD-vlag (2 stuks inbegrepen in aansluitpakket)</td>
            <td>
              <strong>€35</strong> per extra stuk
            </td>
          </tr>
          <tr>
            <td>Gevelschild (1 stuk inbegrepen in aansluitpakket)</td>
            <td>inbegrepen</td>
          </tr>
        </tbody>
      </table>

      <h3>Proeve van Bekwaamheid (PvB)</h3>
      <p>
        Wanneer een kandidaat op jouw locatie een instructeurs-, leercoach- of
        beoordelaarsdiploma afsluit, neem je een PvB af. Een onafhankelijke
        beoordelaar uit de{" "}
        <Link href="/actueel/Tm4kP9wQ-rollen-binnen-het-nwd-transparant-over-onze-kwaliteitspoules">
          beoordelaarspoule
        </Link>{" "}
        voert de PvB uit.
      </p>
      <table>
        <thead>
          <tr>
            <th>Situatie</th>
            <th>Tarief</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Reguliere PvB (praktijk + portfolio&apos;s)</td>
            <td>
              <strong>€150 per PvB</strong>
            </td>
          </tr>
          <tr>
            <td>Clusteraanvraag — eerste PvB</td>
            <td>
              <strong>€150</strong>
            </td>
          </tr>
          <tr>
            <td>Clusteraanvraag — elke volgende PvB</td>
            <td>
              <strong>€100</strong>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Een <strong>clusteraanvraag</strong> is een aanvraag van meerdere
        praktijk-PvB&apos;s op dezelfde dag, op dezelfde locatie, die door
        dezelfde beoordelaar mogen worden afgenomen. Een cluster kan bestaan
        uit meerdere PvB&apos;s van dezelfde kandidaat, een PvB van meerdere
        kandidaten, of een combinatie. Portfolio-PvB&apos;s van dezelfde
        kandidaat worden meegenomen op de dag, maar tellen niet mee voor de
        clusterdefinitie.
      </p>

      <h3>Controlebezoek</h3>
      <p>
        Het NWD controleert aangesloten locaties periodiek op kwaliteit en
        veiligheid. Reguliere controlebezoeken zitten in de jaarbijdrage.
        Alleen een hercontrole wordt apart in rekening gebracht.
      </p>
      <table>
        <thead>
          <tr>
            <th>Situatie</th>
            <th>Tarief</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Regulier controlebezoek</td>
            <td>
              <strong>In jaarbijdrage inbegrepen</strong>
            </td>
          </tr>
          <tr>
            <td>Hercontrole</td>
            <td>
              <strong>€350</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Aansluiting als nieuwe locatie</h3>
      <p>
        Aspirant-leden doorlopen een intaketraject dat door een lid van de{" "}
        <Link href="/vereniging/kwaliteitscommissie">Kwaliteitscommissie</Link>{" "}
        wordt uitgevoerd. Het intakebezoek toetst of de locatie voldoet aan de{" "}
        <Link href="/vaarlocaties/kwaliteitsgarantie">
          NWD-kwaliteitsgarantie
        </Link>{" "}
        en resulteert in een advies aan het bestuur. Aan de aansluiting zijn
        twee eenmalige kosten verbonden:
      </p>
      <table>
        <thead>
          <tr>
            <th>Onderdeel</th>
            <th>Tarief</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Intake (inclusief onboardingpakket met vlag en gevelbord)
            </td>
            <td>
              <strong>€750</strong> (vooraf gefactureerd)
            </td>
          </tr>
          <tr>
            <td>
              Investeringsbijdrage (verdeeld over drie verenigingsjaren:
              €500 / €500 / €250)
            </td>
            <td>
              <strong>€1.250</strong>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        De <strong>investeringsbijdrage</strong> is het aandeel van een nieuwe
        locatie in de investeringen die de vereniging heeft gedaan in het
        IT-systeem, de merkontwikkeling en het opleidingskader. Nieuwe leden
        dragen op deze manier gespreid bij aan wat bestaande leden al hebben
        opgebouwd.
      </p>
      <p>
        Bovenop deze eenmalige kosten gelden vanaf het eerste verenigingsjaar
        de <Link href="#locaties">jaarlijkse bijdrage</Link> en de kosten per
        uitgegeven diploma zoals hierboven vermeld. Een bredere
        kostenvergelijking met andere scenario&apos;s (Watersport Academy, CWO
        + KSS) vind je op de{" "}
        <Link href="/voor-vaarlocaties">pagina voor vaarlocaties</Link>.
      </p>

      <h2 id="opleidingen">Opleidingskosten voor deelnemers</h2>
      <p>
        De tarieven in deze sectie gelden uitsluitend voor de{" "}
        <strong>niveau&nbsp;5-opleiding</strong> die centraal vanuit het NWD
        wordt georganiseerd — de opleiding tot Instructeur&nbsp;5,
        Leercoach&nbsp;5 of Beoordelaar&nbsp;5. Voor opleidingen op lagere
        niveaus (I1 t/m I4, L4 en B4) is de vaarlocatie zelf verantwoordelijk
        voor organisatie en tarifering; daarover maak je afspraken met de
        betreffende locatie.
      </p>
      <p>
        De niveau&nbsp;5-opleiding is toegankelijk voor iedereen die aan de
        vooropleiding voldoet — je hoeft niet per se werkzaam te zijn bij een
        aangesloten vaarlocatie. Wie dat wel is, krijgt een gereduceerd tarief
        omdat de locatie al via de jaarbijdrage aan de vereniging bijdraagt.
      </p>

      <h3>Opleiderscursus</h3>
      <p>
        In het cursusgeld zijn de bijbehorende lesmomenten, materialen en de
        eerste <strong>twee fysieke bezoeken</strong> van de externe leercoach
        inbegrepen. Heeft een deelnemer meer begeleiding nodig? Elk volgend
        leercoach-bezoek wordt apart in rekening gebracht.
      </p>
      <table>
        <thead>
          <tr>
            <th>Deelnemer</th>
            <th>Tarief</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Deelnemer van een NWD-aangesloten vaarlocatie</td>
            <td>
              <strong>€650</strong>
            </td>
          </tr>
          <tr>
            <td>Externe deelnemer</td>
            <td>
              <strong>€1.300</strong>
            </td>
          </tr>
          <tr>
            <td>Extra leercoach-bezoek (vanaf het derde)</td>
            <td>
              <strong>€150 per bezoek</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Wijziging en geldigheid</h2>
      <p>
        De tarieven worden vastgesteld door het bestuur en periodiek
        geëvalueerd. Wijzigingen worden via deze pagina en het secretariaat
        gecommuniceerd. Vragen over een specifieke situatie?{" "}
        <Link href="/contact">Neem contact op</Link>.
      </p>
    </article>
  );
}
