import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import Double from "~/app/_components/brand/double-line";

const risksWithout = [
  "Geen garantie voor een veilige accommodatie",
  "Een diploma zonder officiele erkenning",
  "Twijfels over de veiligheid van het materiaal",
  "Onzekerheid over de kwaliteit van de lessen",
];

const benefitsWith = [
  "Zorgeloos verblijven dankzij strenge veiligheidscontroles",
  "Het enige diploma erkend door het Watersportverbond",
  "Gegarandeerd varen met modern en gekeurd materiaal",
  "Les van experts die continu worden bijgeschoold",
];

export default function Comparison() {
  return (
    <section className="mx-auto w-full max-w-(--breakpoint-xl)">
      <div className="grid gap-8">
        <div className="grid gap-3">
          <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
            <span className="whitespace-nowrap">De nationale standaard</span>
            <Double />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
            Kies voor zekerheid, niet voor een gok
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Without NWD */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Varen zonder keurmerk
            </h3>
            <ul className="space-y-4">
              {risksWithout.map((risk) => (
                <li key={risk} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <XMarkIcon className="size-3.5 text-red-600" />
                  </span>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    {risk}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* With NWD */}
          <div className="rounded-2xl border-2 border-branding-dark bg-branding-dark p-6 sm:p-8 shadow-lg ring-4 ring-branding-dark/10">
            <h3 className="text-lg font-bold text-white mb-6">
              Leren bij een NWD-locatie
            </h3>
            <ul className="space-y-4">
              {benefitsWith.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <CheckIcon className="size-3.5 text-white" />
                  </span>
                  <span className="text-white/85 text-sm leading-relaxed">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
