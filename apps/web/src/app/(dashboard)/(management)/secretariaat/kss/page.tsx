import {
  AcademicCapIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
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
    description: "Beheer kerntaken binnen kwalificatieprofielen",
    href: "/secretariaat/kss/kerntaken",
    icon: DocumentTextIcon,
  },
  {
    title: "Werkprocessen",
    description: "Beheer werkprocessen binnen kerntaken",
    href: "/secretariaat/kss/werkprocessen",
    icon: BriefcaseIcon,
  },
  {
    title: "Beoordelingscriteria",
    description: "Beheer beoordelingscriteria voor werkprocessen",
    href: "/secretariaat/kss/beoordelingscriteria",
    icon: CheckBadgeIcon,
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
    <>
      <Heading>KSS Beheer</Heading>
      <Text>
        Beheer de Kwalificatie Structuur Sport (KSS) onderdelen voor
        toetsdocumenten en PVB aanvragen.
      </Text>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kssManagementSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group relative rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-start gap-x-3">
              <section.icon className="h-6 w-6 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {section.title}
                </h3>
                <Text className="text-sm">{section.description}</Text>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
