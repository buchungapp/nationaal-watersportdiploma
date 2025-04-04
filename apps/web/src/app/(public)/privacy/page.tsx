import type { Metadata, ResolvingMetadata } from "next";
import { Prose } from "~/app/(public)/_components/prose";

import PageHero from "../_components/style/page-hero";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Privacyverklaring",
    description:
      "Lees hier de privacyverklaring van het Nationaal Watersportdiploma.",
    alternates: {
      canonical: "/privacy",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Privacyverklaring",
      description:
        "Lees hier de privacyverklaring van het Nationaal Watersportdiploma.",
      url: "/privacy",
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
              Privacyverklaring
            </h1>
          </div>
        </div>
      </PageHero>
      <div className="px-6 max-w-prose mx-auto py-20 lg:px-8">
        <Prose>
          <p>
            Nationaal Watersportdiploma, gevestigd aan Waldropstraat 5, 2521CA
            Den Haag, is verantwoordelijk voor de verwerking van
            persoonsgegevens zoals weergegeven in deze privacyverklaring.
          </p>

          <h2>Contactgegevens</h2>
          <p>
            <a href="https://www.nationaalwatersportdiploma.nl">
              https://www.nationaalwatersportdiploma.nl
            </a>
            <br />
            Waldorpstraat 5
            <br />
            2521CA Den Haag
            <br />
            085 - 782 27 77
          </p>

          <h2>Persoonsgegevens die wij verwerken</h2>
          <p>
            Nationaal Watersportdiploma verwerkt je persoonsgegevens doordat je
            gebruik maakt van onze diensten en/of omdat je deze gegevens zelf
            aan ons verstrekt.
          </p>
          <p>
            Hieronder vind je een overzicht van de persoonsgegevens die wij
            (mogelijk) verwerken:
          </p>
          <ul>
            <li>Voor- en achternaam</li>
            <li>Geboortedatum</li>
            <li>Geboorteplaats</li>
            <li>E-mailadres</li>
            <li>Profielfoto</li>
          </ul>

          <h2>Bijzondere en/of gevoelige persoonsgegevens die wij verwerken</h2>
          <p>
            Nationaal Watersportdiploma verwerkt de volgende bijzondere en/of
            gevoelige persoonsgegevens van jou:
          </p>
          <ul>
            <li>Gegevens van personen jonger dan 16 jaar</li>
          </ul>
          <p>
            Wij verzamelen en verwerken gegevens van personen jonger dan 16 jaar
            omdat zij deelnemen aan onze watersportopleidingen. Deze gegevens
            worden opgeslagen om hen later verder te kunnen laten werken aan hun
            diploma. Doordat de boeking voor de opleiding door de ouders of
            voogd wordt gedaan, gaan wij ervan uit dat zij toestemming hebben
            gegeven voor het verwerken van deze gegevens.
          </p>

          <h2>
            Met welk doel en op basis van welke grondslag wij persoonsgegevens
            verwerken
          </h2>
          <p>
            Nationaal Watersportdiploma verwerkt jouw persoonsgegevens voor de
            volgende doelen:
          </p>
          <ul>
            <li>Je de mogelijkheid te bieden een account aan te maken</li>
            <li>
              Het bijhouden van een landelijk register van watersportdiploma's
            </li>
            <li>
              Het bijhouden van de voortgang van deelnemers aan
              watersportopleidingen
            </li>
          </ul>

          <p>
            Om de door u geboekte vaaropleiding te verzorgen is het noodzakelijk
            uw vorderingen bij te houden. Uw NWD-locatie doet dat in het
            digitale systeem op nationaalwatersportdiploma.nl. Het NWD ontvangt
            uw gegevens doordat uw NWD-locatie uw gegevens in het systeem
            invoert. Het NWD beheert deze gegevens alleen en maakt daar verder
            geen gebruik van.
          </p>
          <p>
            Het verstrekken en verwerken van deze gegevens is noodzakelijk om de
            overeenkomst voor het verzorgen van uw vaaropleiding volgens de
            NWD-regels uit te voeren. Deze noodzaak is dan ook de wettelijke
            grondslag voor het verstrekken en verwerken van uw gegevens.
          </p>
          <p>
            Instructeurs van uw NWD-locatie hebben alleen inzage in uw naam, uw
            diploma's, vorderingen en de notities van instructeurs daarbij. Zij
            hebben deze inzage alleen in de periode waarin u les krijgt en
            alleen wanneer de instructeur in die zelfde periode les geeft.
          </p>

          <h2>Hoe lang we persoonsgegevens bewaren</h2>
          <p>
            Nationaal Watersportdiploma bewaart je persoonsgegevens niet langer
            dan strikt nodig is om de doelen te realiseren waarvoor je gegevens
            worden verzameld. Wij hanteren de volgende bewaartermijnen voor de
            volgende (categorieën) van persoonsgegevens:
          </p>

          <h2>Delen van persoonsgegevens met derden</h2>
          <p>
            Nationaal Watersportdiploma deelt jouw persoonsgegevens met
            verschillende derden als dit noodzakelijk is voor het uitvoeren van
            de overeenkomst en om te voldoen aan een eventuele wettelijke
            verplichting. Met bedrijven die je gegevens verwerken in onze
            opdracht, sluiten wij een verwerkersovereenkomst om te zorgen voor
            eenzelfde niveau van beveiliging en vertrouwelijkheid van jouw
            gegevens. Nationaal Watersportdiploma blijft verantwoordelijk voor
            deze verwerkingen.
          </p>

          <h2>Cookies, of vergelijkbare technieken, die wij gebruiken</h2>
          <p>
            Nationaal Watersportdiploma gebruikt alleen technische en
            functionele cookies. En analytische cookies die geen inbreuk maken
            op je privacy. Een cookie is een klein tekstbestand dat bij het
            eerste bezoek aan deze website wordt opgeslagen op jouw computer,
            tablet of smartphone. De cookies die wij gebruiken zijn noodzakelijk
            voor de technische werking van de website en jouw gebruiksgemak. Ze
            zorgen ervoor dat de website naar behoren werkt en onthouden
            bijvoorbeeld jouw voorkeursinstellingen. Ook kunnen wij hiermee onze
            website optimaliseren. Je kunt je afmelden voor cookies door je
            internetbrowser zo in te stellen dat deze geen cookies meer opslaat.
            Daarnaast kun je ook alle informatie die eerder is opgeslagen via de
            instellingen van je browser verwijderen.
          </p>

          <h2>Gegevens inzien, aanpassen of verwijderen</h2>
          <p>
            Je hebt het recht om je persoonsgegevens in te zien, te corrigeren
            of te verwijderen. Dit kun je zelf doen via de persoonlijke
            instellingen van jouw account. Daarnaast heb je het recht om je
            eventuele toestemming voor de gegevensverwerking in te trekken of
            bezwaar te maken tegen de verwerking van jouw persoonsgegevens door
            ons bedrijf en heb je het recht op gegevensoverdraagbaarheid. Dat
            betekent dat je bij ons een verzoek kan indienen om de
            persoonsgegevens die wij van jou beschikken in een computerbestand
            naar jou of een ander, door jou genoemde organisatie, te sturen.
          </p>
          <p>
            Wil je gebruik maken van je recht op bezwaar en/of recht op
            gegevensoverdraagbaarheid of heb je andere vragen/opmerkingen over
            de gegevensverwerking, stuur dan een gespecificeerd verzoek naar{" "}
            <a href="mailto:info@nationaalwatersportdiploma.nl">
              info@nationaalwatersportdiploma.nl
            </a>
            .
          </p>
          <p>
            Om er zeker van te zijn dat het verzoek tot inzage door jou is
            gedaan, vragen wij jou een kopie van je identiteitsbewijs bij het
            verzoek mee te sturen. Maak in deze kopie je pasfoto, MRZ (machine
            readable zone, de strook met nummers onderaan het paspoort),
            paspoortnummer en Burgerservicenummer (BSN) zwart. Dit ter
            bescherming van je privacy. Nationaal Watersportdiploma zal zo snel
            mogelijk, maar in ieder geval binnen vier weken, op jouw verzoek
            reageren.
          </p>
          <p>
            Nationaal Watersportdiploma wil je er tevens op wijzen dat je de
            mogelijkheid hebt om een klacht in te dienen bij de nationale
            toezichthouder, de Autoriteit Persoonsgegevens. Dat kan via de
            volgende link:{" "}
            <a href="https://autoriteitpersoonsgegevens.nl/nl/contact-met-de-autoriteit-persoonsgegevens/tip-ons">
              https://autoriteitpersoonsgegevens.nl/nl/contact-met-de-autoriteit-persoonsgegevens/tip-ons
            </a>
          </p>

          <h2>Hoe wij persoonsgegevens beveiligen</h2>
          <p>
            Nationaal Watersportdiploma neemt de bescherming van jouw gegevens
            serieus en neemt passende maatregelen om misbruik, verlies,
            onbevoegde toegang, ongewenste openbaarmaking en ongeoorloofde
            wijziging tegen te gaan. Als jij het idee hebt dat jouw gegevens
            toch niet goed beveiligd zijn of er aanwijzingen zijn van misbruik,
            neem dan contact op met onze klantenservice of via{" "}
            <a href="mailto:info@nationaalwatersportdiploma.nl">
              info@nationaalwatersportdiploma.nl
            </a>
            .
          </p>
        </Prose>
      </div>
    </main>
  );
}
