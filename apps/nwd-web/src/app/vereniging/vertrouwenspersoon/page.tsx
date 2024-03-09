import Image from "next/image";
import Link from "next/link";

import vertrouwenspersoon from "./_assets/vertrouwenspersoon.jpg";

export default function Vertrouwenspersoon() {
  return (
    <article className="prose">
      <div className="prose-lg">
        <h3>Vertrouwenspersoon</h3>
        <p>
          Een vertrouwenspersoon geeft steun en advies aan personen die te maken krijgen met
          ongewenst gedrag. Ongewenst gedrag is de verzamelnaam voor agressie, pesten, discriminatie
          en seksuele intimidatie.
        </p>
      </div>
      <p>
        De vertrouwenspersoon:
        <ul>
          <li>Zorgt voor adequate opvang van personen die te maken hebben met ongewenst gedrag</li>
          <li>Biedt een luisterend oor</li>
          <li>Kijkt in eerste instantie naar mogelijke oplossingen in de informele sfeer</li>
          <li>Bespreekt met jou welke andere opties er zijn</li>
          <li>Begeleidt je, maar alleen wanneer jij dit wenst</li>
          <li>Kan je ook wijzen op andere hulpverlenende instanties of zorgprofessionals</li>
          <li>Heeft geheimhoudingsplicht</li>
        </ul>
        Ervaar je ongewenst gedrag tijdens je werkzaamheden bij een vaarlocatie aangesloten bij het
        NWD? Dit nemen we serieus. Het Nationaal Watersportdiploma biedt alle vrijwilligers,
        opdrachtnemers, instructeurs, en medewerkers toegang tot een vertrouwenspersoon. Voor hulp
        en begeleiding in dit proces kun je terecht bij de Vertrouwenscontactpersoon (VCP) van jouw
        vaarlocatie. Je staat er niet alleen voor.
      </p>

      <p>
        Op dit moment is <strong>Evert-Jan van den Brink</strong> de vertrouwenspersoon voor het
        Nationaal Watersportdiploma. <br />
        Mailadres:{" "}
        <Link href="mailto:vandenbrink@solvebv.nl">
          vandenbrink
          <wbr />
          @solvebv.nl
        </Link>
        <br />
        Telefoon: <Link href="tel:0653816890">06-53816890</Link>
      </p>
      <Image
        src={vertrouwenspersoon}
        width={vertrouwenspersoon.width}
        height={vertrouwenspersoon.height}
        alt="Evert-Jan van den Brink"
        className="aspect-square object-cover w-56"
      />
    </article>
  );
}
