import Image from "next/image";

import { InlineButton } from "~/app/_components/style/buttons";
import CopyToClipboard from "~/app/_components/style/copy-to-clipboard";
import vertrouwenspersoon from "./_assets/IMG_3314.jpg";

import type { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Vertrouwenspersoon",
    openGraph: {
      ...parentOpenGraph,
      title: "Vertrouwenspersoon",
      url: "/vereniging/vertrouwenspersoon",
    },
  };
}

export default function Page() {
  return (
    <article className="prose max-w-prose">
      <div className="prose-lg">
        <p>
          Een vertrouwenspersoon zorgt voor de opvang en geeft steun en advies
          aan personen die te maken krijgen met ongewenst gedrag. Ongewenst
          gedrag is de verzamelnaam voor agressie, pesten, discriminatie en
          (seksuele) intimidatie.
        </p>
        <p>
          Daarnaast kan je bij een vertrouwenspersoon terecht als je een
          integriteitskwestie wil bespreken omdat je geconfronteerd wordt met
          mogelijke overtredingen van wettelijke regels of (veiligheids-) regels
          die gelden binnen de organisatie.
        </p>
      </div>
      <div>
        <p>De vertrouwenspersoon:</p>
        <ul>
          <li>
            Zorgt voor adequate opvang van personen die te maken hebben met
            ongewenst gedrag en/of schendingen van integriteit;
          </li>
          <li>Biedt een luisterend oor;</li>
          <li>
            Kijkt in eerste instantie naar mogelijke oplossingen in de informele
            sfeer (de-escalatie);
          </li>
          <li>
            Bespreekt met jou welke andere oplossingsrichtingen er zijn en
            schetst de gevolgen van deze mogelijkheden;
          </li>
          <li>
            Begeleidt je, maar alleen wanneer jij dit wenst en jij houdt de
            regie over het verloop va het proces;
          </li>
          <li>
            Kan je ook wijzen op andere hulpverlenende instanties of
            zorgprofessionals;
          </li>
          <li>Heeft geheimhoudingsplicht.</li>
        </ul>
        <p>
          Ervaar je ongewenst gedrag tijdens je werkzaamheden bij een
          vaarlocatie aangesloten bij het NWD? Dit nemen we serieus. Het
          Nationaal Watersportdiploma biedt alle vrijwilligers, opdrachtnemers,
          instructeurs, en medewerkers toegang tot een vertrouwenspersoon. Voor
          hulp en begeleiding in dit proces kun je terecht bij de
          Vertrouwenscontactpersoon (VCP) van jouw vaarlocatie. Je staat er niet
          alleen voor.
        </p>
      </div>

      <p>
        De vertrouwenspersoon van het Nationaal Watersportdiploma is{" "}
        <strong>Evert-Jan van den Brink</strong>. Evert-Jan heeft veel ervaring
        opgedaan als advocaat en mediator bij het oplossen van problemen en
        neemt deze kennis en kunde mee in zijn rol als vertrouwenspersoon.
        Daarnaast is Evert-Jan toegankelijk en empathisch en kan hij als
        strategisch denker jou ondersteunen bij het vinden van een oplossing die
        het beste bij jou past en jou optimale bescherming biedt om een veilige
        en plezierige werkomgeving voor jou te behouden.
      </p>
      <p>
        Evert-Jan is telefonisch bereikbaar onder nummer:{" "}
        <InlineButton href="tel:0653816890">06 538 168 90</InlineButton> en per
        mail:{" "}
        <CopyToClipboard
          value="vandenbrink@solvebv.nl"
          className="font-medium underline"
        >
          vandenbrink
          <wbr />
          @solvebv.nl
        </CopyToClipboard>
        .
      </p>
      <Image
        src={vertrouwenspersoon}
        width={vertrouwenspersoon.width}
        height={vertrouwenspersoon.height}
        placeholder="blur"
        alt="Evert-Jan van den Brink"
        className="aspect-square w-56 object-cover"
      />
    </article>
  );
}
