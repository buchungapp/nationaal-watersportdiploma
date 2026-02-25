import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import { retrieveLocations } from "../../vaarlocaties/_lib/retrieve-locations";
import DeferredLocationsMap from "./deferred-locations-map";

export default async function Locations() {
  const locations = await retrieveLocations();

  return (
    // Z-index is required to make the overflow-hidden work on safari
    <section className="grid w-full overflow-hidden z-0 rounded-[3rem] bg-branding-orange lg:grid-cols-2">
      <div className="flex items-center">
        <div className="px-4 py-12 text-white lg:p-16">
          <div className="flex items-center gap-x-3 font-bold uppercase text-white">
            Vaarlocaties
            <Double />
          </div>
          <h3 className="mt-1.5 text-2xl font-bold text-white">
            Vind jouw NWD vaarschool.
          </h3>
          <p className="mt-2.5 text-orange-100">
            Elke stip op de kaart is een locatie die voldoet aan de strengste
            eisen voor veiligheid, instructeurskwaliteit en materiaal. Kies een
            NWD-school bij jou in de buurt en ga zorgeloos het water op.
          </p>

          <div className="mt-8 flex items-center gap-x-6">
            <BoxedButton
              href="/vaarlocaties"
              className="bg-white text-slate-900"
            >
              Vind een veilige locatie
            </BoxedButton>
          </div>
        </div>
      </div>
      <div className="h-full min-h-[24rem] w-full">
        <DeferredLocationsMap locations={locations} />
      </div>
    </section>
  );
}
