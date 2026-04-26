import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentCheckIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type Phase = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  body: string;
  actors: string[];
  status: string;
};

const phases: Phase[] = [
  {
    icon: DocumentCheckIcon,
    label: "Aanvraag samenstellen",
    body: "Kandidaat of locatiebeheerder stelt de PvB-aanvraag samen. Kies de cursus(sen), de kerntaken en of het een interne of externe aanvraag is. De aanvraag wordt gebundeld — meerdere onderdelen in één proces.",
    actors: ["Kandidaat", "Locatiebeheerder"],
    status: "concept",
  },
  {
    icon: PaperAirplaneIcon,
    label: "Indienen",
    body: "De locatiebeheerder dient de aanvraag in. Hiermee start het vervullen van de voorwaarden parallel: leercoach-toestemming, beoordelaar-toewijzing en het plannen van een startdatum.",
    actors: ["Locatiebeheerder"],
    status: "wacht_op_voorwaarden",
  },
  {
    icon: UserGroupIcon,
    label: "Voorwaarden vervullen",
    body: "Drie sporen lopen gelijktijdig: (1) de leercoach geeft toestemming, (2) een PvB-beoordelaar wordt toegewezen (voor niveau 4/5 namens de Watersport Academy), (3) een startdatum wordt gepland op basis van voorgestelde data.",
    actors: ["Leercoach", "Beoordelaar", "Secretariaat"],
    status: "wacht_op_voorwaarden",
  },
  {
    icon: CalendarDaysIcon,
    label: "Gereed voor beoordeling",
    body: "Alle voorwaarden zijn vervuld. De kandidaat dient portfolio-stukken in (voor portfolio-onderdelen) en bereidt zich voor op de praktijkdag (voor praktijk-onderdelen).",
    actors: ["Kandidaat"],
    status: "gereed_voor_beoordeling",
  },
  {
    icon: ClipboardDocumentCheckIcon,
    label: "Beoordeling",
    body: "Per kerntaak-onderdeel een uitslag: portfolio wordt schriftelijk beoordeeld, praktijk wordt live geobserveerd en een assessment kan beide combineren in een reflectiegesprek. Het vier-ogen-principe geldt — de beoordelaar en leercoach moeten beiden akkoord zijn.",
    actors: ["Beoordelaar", "Leercoach"],
    status: "in_beoordeling",
  },
  {
    icon: CheckCircleIcon,
    label: "Afronden",
    body: "Alle onderdelen behaald → de kwalificatie wordt vastgelegd in het register. Eventueel niet-behaalde onderdelen kunnen opnieuw worden aangevraagd via een nieuwe PvB-cyclus.",
    actors: ["Secretariaat"],
    status: "afgerond",
  },
];

const actorColors: Record<string, string> = {
  Kandidaat: "bg-slate-100 text-slate-700",
  Locatiebeheerder: "bg-branding-light/10 text-branding-dark",
  Leercoach: "bg-branding-orange/10 text-branding-orange",
  Beoordelaar: "bg-branding-dark/10 text-branding-dark",
  Secretariaat: "bg-slate-100 text-slate-700",
};

export function PvbTimeline() {
  return (
    <div className="not-prose relative">
      <div className="absolute bottom-6 left-5 top-6 w-0.5 bg-slate-200" aria-hidden="true" />
      <ol className="flex flex-col gap-5">
        {phases.map((phase) => {
          const Icon = phase.icon;
          return (
            <li key={phase.label} className="flex gap-4">
              <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-branding-light/40">
                <Icon className="size-5 text-branding-light" />
              </div>
              <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    {phase.label}
                  </h3>
                  <span className="font-mono text-xs text-slate-500">
                    status: {phase.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{phase.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {phase.actors.map((actor) => (
                    <span
                      key={actor}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${actorColors[actor] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
