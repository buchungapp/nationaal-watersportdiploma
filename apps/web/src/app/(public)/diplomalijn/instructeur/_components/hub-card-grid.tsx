import {
  AcademicCapIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const hubs = [
  {
    href: "/diplomalijn/instructeur/eigenvaardigheid",
    title: "Eigenvaardigheid",
    description: "NWD A, B en C per discipline.",
    icon: WrenchScrewdriverIcon,
  },
  {
    href: "/diplomalijn/instructeur/pvbs",
    title: "Proeven van Bekwaamheid",
    description: "Wat een PvB is en wie ze afneemt.",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    href: "/diplomalijn/instructeur/instructiegroepen",
    title: "Instructiegroepen",
    description: "Groepering van disciplines en vrijstellingen.",
    icon: UserGroupIcon,
  },
  {
    href: "/diplomalijn/instructeur/erkenningen",
    title: "Erkenningen",
    description: "Landelijke en internationale erkenning.",
    icon: GlobeAltIcon,
  },
  {
    href: "/diplomalijn/instructeur/overgang-cwo",
    title: "Overgang CWO",
    description: "Verschil CWO/NWD en wat overzet.",
    icon: AcademicCapIcon,
  },
  {
    href: "/diplomalijn/instructeur/veelgestelde-vragen",
    title: "Veelgestelde vragen",
    description: "Antwoorden en begrippen.",
    icon: ChatBubbleLeftRightIcon,
  },
] as const;

export function HubCardGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {hubs.map(({ href, title, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-branding-light/40 hover:bg-branding-light/5 hover:shadow-md"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-branding-light/10 text-branding-dark">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <p className="text-base font-semibold text-slate-900 group-hover:text-branding-dark">
            {title}
          </p>
          <p className="text-sm text-slate-600">{description}</p>
          <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-branding-dark group-hover:underline">
            Naar pagina
            <ArrowRightIcon className="size-3.5" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}
