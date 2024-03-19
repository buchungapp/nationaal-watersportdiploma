import { Prose } from "~/app/_components/prose";
import PageHero from "~/app/_components/style/page-hero";

export default function Page() {
  return (
    <>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="text-4xl font-bold lg:leading-[1.15] lg:text-5xl max-w-prose">
              Kwaliteitseisen
            </h1>
            <p className="text-xl">
              De eisen voor deelnemende vaarlocaties die de drie pijlers
              veiligheid, kwaliteit en plezier moeten waarborgen.
            </p>
          </div>
        </div>
      </PageHero>
      <div className="mt-16 lg:mt-24">
        <div className="mx-auto max-w-2xl">
          <Prose className="mt-8">
            <p>
              Of je nou consument of instructeur bent, je wilt er zeker van zijn
              dat de vaarlocatie waar je komt voldoet aan de juiste eisen.
              Daarom hebben wij een aantal kwaliteitseisen opgesteld die
              deelnemende vaarlocaties moeten waarborgen. Deze eisen zijn
              onderverdeeld in drie pijlers: veiligheid, wet- & regelgeving en
              kwaliteit.
            </p>

            <p>
              Het NWD controleert de vaarlocaties op deze eisen. Zo zorgen we
              ervoor dat jij als consument of instructeur altijd op een veilige,
              kwalitatieve en plezierige manier kunt varen.
            </p>

            <h2>Veiligheid & Gezondheid</h2>
            <ul>
              <li>
                Cursisten zijn in elke bootsoort verplicht zwemvesten of
                reddingsvesten (met CE-markering) te dragen. Bij jachtzeilen is
                het dragen van een reddingsvest (met CE-markering) altijd
                verplicht.
              </li>
              <li>
                Cursisten zijn onder bepaalde omstandigheden verplicht een
                goedpassende helm (met CE-markering) te dragen, kielboot en
                jachtzeilen uitgesloten.
              </li>
              <li>
                De vaarlocatie hanteert een strikt rookvrij beleid (inclusief
                e-sigaretten en vapes). Dit betekent dat er niet wordt gerookt
                door, of in het zicht van, minderjarigen, ook niet buiten op het
                terrein van de vaarlocatie. In binnenruimten wordt überhaupt
                niet gerookt.
              </li>
              <li>Gebruik van soft- en harddrugs zijn strikt verboden.</li>
              <li>
                Alle betaalde medewerkers en aandeelhouders zijn in het bezit
                van een geldig Verklaring Omtrent het Gedrag (VOG). Een VOG is
                drie jaar geldig en dient daarna opnieuw aangevraagd te worden.
              </li>
              <li>
                Alle vrijwilligers, opdrachtnemers, betaalde medewerkers en
                aandeelhouders hebben de gedragscode NWD ondertekend en handelen
                hier zodoende naar. De gedragscode dient jaarlijks aan de start
                van het vaarseizoen opnieuw getekend te worden.
              </li>
              <li>
                Elke locatie beschikt over een vertrouwenscontactpersoon (VCP),
                waar betrokkenen terecht kunnen.
              </li>
            </ul>

            <h2>Wet- & Regelgeving</h2>
            <p>
              Uiteraard dienen de deelnemende vaarlocaties zich te houden aan de
              geldende wet- en regelgeving. Enkele zaken die we daarbij willen
              uitlichten:
            </p>
            <ul>
              <li>
                Consumenten zijn verzekerd tegen een faillissement van de
                vaarlocatie middels een insolventieverzekering
              </li>
              <li>
                Alcohol, drugs en rookwetgeving wordt nageleefd en indien
                alcohol wordt geschonken is er een geldige vergunning hiervoor.
              </li>
              <li>
                De accommodatie beschikt over een brandmeldinstallatie die
                voldoet aan de accommodatie specifieke eisen.
              </li>
              <li>
                Alle medewerkers, vrijwilligers en opdrachtnemers zijn voor
                arbeidsongeschiktheid verzekerd.
              </li>
              <li>
                Installatiewerk heeft - waar nodig - de benodigde keuringen en
                (SCOPE) certificeringen (denk aan zonnepanelen, meterkasten,
                etc.).
              </li>
              <li>
                De accommodatie heeft een geldig legionellabeheersplan en leeft
                deze na.
              </li>
              <li>Keuken en horeca voldoen aan de HACCP-richtlijnen.</li>
            </ul>

            <h2>Kwaliteit</h2>
            <ul>
              <li>
                Vaarlocatie respecteert de gestelde ratio's instructeur/lesboten
              </li>
              <li>
                Vaarlocatie respecteert de gestelde ratio's
                instructeur/cursisten
              </li>
              <li>
                Vaarlocatie respecteert de gestelde ratio's lesboten/volgboten
              </li>
              <li>
                Vaarlocatie is in het bezit van een rescue vloot die recht doet
                aan vaarwater, weersomstandigheden en type lesboten.
              </li>
              <li>
                Vaarlocatie is in staat haar eigen instructeurs op te leiden.
              </li>
              <li>
                Vaarlocatie biedt instructeurs her- en bijscholingen (zowel
                theoretisch als praktijk) jaarrond aan.
              </li>
              <li>
                Vaarlocatie heeft altijd minimaal één gekwalificeerde ZI-4 of
                hoger aanwezig tijdens de uitvoer van NWD-gerelateerde
                activiteiten.
              </li>
            </ul>
          </Prose>
        </div>
      </div>
    </>
  );
}
