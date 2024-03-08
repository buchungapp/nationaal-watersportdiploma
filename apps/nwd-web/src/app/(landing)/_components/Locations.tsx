import Image from "next/image";

import Article from "~/app/_components/style/Article";
import { BoxedButton } from "~/app/_components/style/Buttons";
import locations from "./_assets/locations.png";

export default function Locations() {
  return (
    <section className="w-full bg-branding-orange rounded-[3rem] grid items-center lg:grid-cols-2 overflow-hidden">
      <Article className="px-4 py-12 lg:p-16 text-white">
        <Article.Heading>Locaties</Article.Heading>
        <Article.Title>Vind jouw NWD-vaarlocatie.</Article.Title>
        <Article.Paragraph>
          NWD-locaties voldoen aan strenge kwaliteitseisen op gebied van persoonlijke- en sociale
          veiligheid. Verder hebben zij zich gecommitteerd aan de visie van het NWD: veiligheid,
          kwaliteit en plezier op het water. Daarom zijn zij gelicenseerd om het NWD-diploma uit te
          geven.
        </Article.Paragraph>
        <Article.ButtonSection className="mt-8">
          <BoxedButton href="/locaties" className="bg-white text-slate-900">
            Bekijk NWD locaties
          </BoxedButton>
          <BoxedButton href="/kwaliteitseisen-locaties" className="bg-branding-orange text-white">
            Kwaliteitseisen voor locaties
          </BoxedButton>
        </Article.ButtonSection>
      </Article>
      <Image
        src={locations}
        alt="NWD-locaties"
        width={locations.width}
        height={locations.height}
        className="mix-blend-luminosity"
      />
    </section>
  );
}
