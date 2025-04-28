import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "../../_components/style/buttons";

export default function CashbackConditions() {
  return (
    <section className="flex justify-center px-4 lg:px-16 container">
      <div className="flex flex-col gap-8 w-full max-w-5xl">
        <div className="flex flex-col items-center w-full text-center">
          <div className="flex items-center gap-x-3 w-full font-bold text-branding-orange uppercase">
            <Double />
            Actievoorwaarden
            <Double />
          </div>
          <h3 className="mt-1.5 font-bold text-slate-900 text-2xl">
            De actie in het kort
          </h3>
        </div>
        <ul className="space-y-4 lg:space-y-2 p-8 pl-16 border-2 border-branding-light rounded-xl list-disc">
          <li>Je krijgt €50 cashback op je nieuwe zeilcursus of zeilkamp</li>
          <li>De actie loopt van 9 april t/m 1 september 2025</li>
          <li>
            Je kunt meedoen als je in 2024 een CWO-diploma of vorderingsstaat
            hebt behaald
          </li>
          <li>
            Je moet een meerdaagse cursus of kamp boeken (minimaal 2 dagen)
          </li>
          <li>
            Je cursus voor 2025 moet bij een NWD-erkende vaarlocatie zijn
            geboekt (zie nwd.nl/vaarlocaties)
          </li>
          <li>De cursus moet vóór 1 september 2025 plaatsvinden</li>
          <li>
            Upload je diploma/vorderingsstaat en boekingsnummer via het
            aanmeldformulier
          </li>
          <li>Je kunt maar één keer meedoen aan de actie</li>
          <li>Je kunt de cashback niet combineren met andere kortingen</li>
          <li>
            De €50 wordt na je cursus overgemaakt (uiterlijk 31 oktober 2025)
            door het Nationaal Watersportdiploma
          </li>
          <li>Bij annulering van je cursus vervalt het recht op cashback</li>
          <li>
            Je gaat akkoord met de verwerking van je gegevens voor deze actie
          </li>
          <br />

          <BoxedButton
            href="/cashback/voorwaarden"
            className="text-white bg-branding-dark hover:bg-branding-dark/90 w-full text-center justify-center"
          >
            Bekijk de volledige voorwaarden
          </BoxedButton>
        </ul>
      </div>
    </section>
  );
}
