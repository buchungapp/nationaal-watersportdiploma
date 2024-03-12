import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/_components/style/buttons";
import Map from "./map";

export default function Locations() {
  return (
    <section className="w-full bg-branding-orange rounded-[3rem] grid items-center lg:grid-cols-2 overflow-hidden">
      <div className="px-4 py-12 lg:p-16 text-white">
        <div className="flex font-bold uppercase items-center gap-x-3 text-white">
          Locaties
          <Double />
        </div>
        <h3 className="text-white mt-1.5 font-bold text-2xl">Vind jouw NWD-vaarlocatie.</h3>
        <p className="text-orange-100 mt-2.5">
          NWD-locaties voldoen aan strenge kwaliteitseisen op gebied van persoonlijke- en sociale
          veiligheid. Verder hebben zij zich gecommitteerd aan de visie van het NWD: veiligheid,
          kwaliteit en plezier op het water. Daarom zijn zij gelicenseerd om het NWD-diploma uit te
          geven.
        </p>

        <div className="mt-8 flex items-center gap-x-6">
          <BoxedButton href="/locaties" className="bg-white text-gray-900">
            Bekijk NWD locaties
          </BoxedButton>
          <BoxedButton href="/kwaliteitseisen-locaties" className="hover:bg-white/10 text-white">
            Kwaliteitseisen voor locaties
          </BoxedButton>
        </div>
      </div>
      <div className="h-full min-h-[24rem] w-full">
        <Map />
      </div>
    </section>
  );
}
