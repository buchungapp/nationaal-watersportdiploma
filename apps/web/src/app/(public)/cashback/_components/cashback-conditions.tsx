import Double from "~/app/_components/brand/double-line";

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
        <ul className="space-y-2 p-8 border-2 border-branding-light rounded-xl list-disc list-inside">
          <li>De cashback actie loopt van X t/m X.</li>
          <li>Je moet in het bezit zijn van een geldig X.</li>
          <li>
            De cashback is alleen geldig bij het boeken van een nieuwe
            NWD-cursus met een minimale waarde van X.
          </li>
          <li>
            De aanvraag moet binnen 30 dagen na het boeken van de cursus worden
            ingediend.
          </li>
          <li>
            Per persoon kan maximaal één cashback per cursus worden aangevraagd.
          </li>
          <li>
            De cashback wordt uitbetaald na verificatie van de boeking en het x.
          </li>
          <li>
            Bij annulering van de cursus vervalt het recht op de cashback.
          </li>
          <li>
            Nationaal Watersportdiploma behoudt zich het recht voor om de actie
            op elk moment te wijzigen of te beëindigen.
          </li>
        </ul>
      </div>
    </section>
  );
}
