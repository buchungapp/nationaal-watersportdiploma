import {
  AcademicCapIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import { Text } from "~/app/(dashboard)/_components/text";

const kssManagementSections = [
  {
    title: "Kwalificatieprofielen",
    description:
      "Beheer kwalificatieprofielen voor instructeurs, leercoaches en PVB beoordelaars",
    href: "/secretariaat/kss/kwalificatieprofielen",
    icon: AcademicCapIcon,
  },
  {
    title: "Kerntaken",
    description: "Beheer kerntaken, werkprocessen en beoordelingscriteria",
    href: "/secretariaat/kss/kerntaken",
    icon: DocumentTextIcon,
  },
  {
    title: "Instructiegroepen",
    description: "Beheer instructiegroepen en koppel cursussen",
    href: "/secretariaat/kss/instructiegroepen",
    icon: UserGroupIcon,
  },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <Heading level={1}>KSS Beheer</Heading>
        <Text className="mt-2">
          Beheer de Kwalificatie Structuur Sport (KSS) voor instructeurs,
          leercoaches en PVB beoordelaars.
        </Text>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {kssManagementSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group relative rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div>
              <span className="inline-flex rounded-lg p-3 bg-branding-light/10 text-branding-dark group-hover:bg-branding-light/20 transition-colors">
                <section.icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h3>
              <Text className="mt-2 text-sm">{section.description}</Text>
            </div>
            <span
              className="pointer-events-none absolute right-6 top-6 text-gray-300 group-hover:text-gray-400"
              aria-hidden="true"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
