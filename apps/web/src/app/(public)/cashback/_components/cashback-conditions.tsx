import Double from "~/app/_components/brand/double-line";
import { TekstButton } from "../../_components/style/buttons";

export default function CashbackConditions() {
  return (
    <section className="flex justify-center px-4 lg:px-16 container">
      <div className="flex flex-col gap-8 w-full max-w-5xl">
        <div className="flex flex-col items-center w-full text-center">
          <div className="flex items-center gap-x-3 w-full font-bold text-branding-orange uppercase">
            <Double />
            Cashback
            <Double />
          </div>
          <h3 className="mt-1.5 font-bold text-slate-900 text-2xl">
            Actievoorwaarden
          </h3>
        </div>
        <ul className="space-y-4 lg:space-y-2 p-8 pl-16 border-2 border-branding-light rounded-xl list-disc">
          <li>Actieperiode: 22 maart t/m 1 september 2025</li>
          <li>De cursus wordt gestart voor 1 september 2025</li>
          <li>
            Iedereen die in 2024 een CWO-diploma of -vorderingenstaat heeft
            behaald
          </li>
          <li>
            Boek een meerdaagse cursus of zeilkamp bij een erkende NWD-locatie
          </li>
          <li>
            Upload een duidelijk leesbare foto of pdf van je CWO-diploma of
            -vorderingenstaat
            <br />
            <em>Let op: de datum van uitgifte in 2024 moet zichtbaar zijn</em>
          </li>
          <li>Eendaagse cursussen vallen buiten de actie</li>
          <li>
            Kortingen zijn niet stapelbaar: deze actie is niet te combineren met
            andere kortingsacties van de zeilschool
          </li>
          <li>Cashback van €50 per persoon, maximaal één keer per deelnemer</li>
          <li>
            Uitkering in september 2025, uiterlijk op 31 oktober 2025, door het
            Nationaal Watersportdiploma
          </li>
          <br />

          <TekstButton href="/cashback/voorwaarden">
            Bekijk de volledige voorwaarden
          </TekstButton>
        </ul>
      </div>
    </section>
  );
}
