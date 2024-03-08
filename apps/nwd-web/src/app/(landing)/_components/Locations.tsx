import Image from "next/image";
import Balancer from "react-wrap-balancer";
import Double from "~/app/_assets/Double";

import { BoxedButton } from "~/app/_components/style/Buttons";
import locations from "./_assets/locations.png";

export default function Locations() {
  return (
    <section className="w-full bg-branding-orange rounded-[3rem] grid items-center lg:grid-cols-2 overflow-hidden">
      <article className="grid gap-10 px-4 py-12 lg:p-16 text-white">
        <div className="grid gap-2">
          <div className={"flex gap-3 items-center"}>
            <span className="uppercase whitespace-nowrap font-bold">Locaties</span>
            <Double />
          </div>
          <h2 className="font-bold text-2xl">
            <Balancer>Vind jouw NWD-vaarlocatie.</Balancer>
          </h2>
          <p>
            NWD-locaties voldoen aan strenge kwaliteitseisen op gebied van persoonlijke- en sociale
            veiligheid. Verder hebben zij zich gecommitteerd aan de visie van het NWD: veiligheid,
            kwaliteit en plezier op het water. Daarom zijn zij gelicenseerd om het NWD-diploma uit
            te geven.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2">
          <BoxedButton href="/locaties" className="bg-white text-slate-900">
            Bekijk NWD locaties
          </BoxedButton>
          <BoxedButton href="/kwaliteitseisen-locaties" className="bg-branding-orange text-white">
            Kwaliteitseisen voor locaties
          </BoxedButton>
        </div>
      </article>
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
