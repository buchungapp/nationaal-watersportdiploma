import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import { retrieveLocations } from "../../vaarlocaties/_lib/retrieve-locations";
import DeferredLocationsMap from "./deferred-locations-map";

const steps = [
  {
    number: "1",
    title: "Vind een school op de kaart",
    description:
      "Kies een NWD-locatie bij jou in de buurt. Elke stip staat voor gegarandeerde veiligheid en gecontroleerde kwaliteit.",
  },
  {
    number: "2",
    title: "Kies wat je wilt leren",
    description:
      "Bespreek jouw doelen met gekwalificeerde instructeurs. Je traint heel gericht voor de specifieke boot en vaardigheden die jij belangrijk vindt.",
  },
  {
    number: "3",
    title: "Behaal je officiële diploma",
    description:
      "Elke succesvolle oefening wordt direct geregistreerd. Je sluit af met het enige diploma erkend door het Watersportverbond.",
  },
];

export default async function Locations() {
  const locations = await retrieveLocations();

  return (
    // Z-index is required to make the overflow-hidden work on safari
    <section className="grid w-full overflow-hidden z-0 rounded-[3rem] bg-branding-orange lg:grid-cols-2">
      <div className="flex items-center">
        <div className="px-4 py-12 lg:p-16 grid gap-8">
          <div className="grid gap-2">
            <div className="flex items-center gap-x-3 font-bold uppercase text-white/70">
              <span className="whitespace-nowrap">Drie stappen</span>
              <Double className="text-white/40" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Van kaart naar diploma
            </h3>
          </div>

          <div className="grid gap-6">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <span className="text-3xl font-extrabold text-white/20 leading-none">
                  {step.number}
                </span>
                <div className="grid gap-1">
                  <h4 className="font-bold text-white text-sm">
                    {step.title}
                  </h4>
                  <p className="text-orange-100/80 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <BoxedButton
            href="/vaarlocaties"
            className="bg-white text-slate-900 w-fit"
          >
            Vind jouw vaarlocatie
          </BoxedButton>
        </div>
      </div>
      <div className="h-full min-h-[24rem] w-full">
        <DeferredLocationsMap locations={locations} />
      </div>
    </section>
  );
}
