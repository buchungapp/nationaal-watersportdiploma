import { APP_NAME } from "@nawadi/lib/constants";
import SideNav from "../_components/style/side-nav";
import PageHeader from "./_components/page-header";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: `%s | Verenigingszaken | ${APP_NAME}`,
    default: "Verenigingszaken",
  },
};

const verenigingsPages = [
  {
    label: "Manifest",
    slug: "manifest",
    description: "Waar we in geloven bij het Nationaal Watersportdiploma.",
  },
  {
    label: "Vertrouwenspersoon",
    slug: "vertrouwenspersoon",
    description: "Ondersteuning en advies bij ongewenst gedrag.",
  },
  {
    label: "Gedragscode",
    slug: "gedragscode",
    description:
      "Gezamenlijke afspraken tussen alle betrokkenen bij NWD-vaarlocaties.",
  },
  {
    label: "Bestuur",
    slug: "bestuur",
    description:
      "Maak kennis met het bestuur van de vereniging Nationaal Watersportdiploma.",
  },
  {
    label: "Secretariaat",
    slug: "secretariaat",
    description: "Eerste aanspreekpunt voor het Nationaal Watersportdiploma.",
  },
  {
    label: "Kwaliteitscommissie",
    slug: "kwaliteitscommissie",
    description:
      "De kwaliteitscommissie bewaakt de kwaliteit van aangesloten locaties bij het Nationaal Watersportdiploma.",
  },
  {
    label: "Statuten en reglementen",
    slug: "statuten-reglementen",
    description:
      "De statuten en reglementen van het Nationaal Watersportdiploma.",
  },
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <PageHeader pages={verenigingsPages} />
      <div className="mt-12 grid grid-cols-1 items-start gap-12 px-4 sm:grid-cols-[1fr,3fr] lg:px-16">
        <div className="flex justify-end">
          <SideNav
            label="Verenigingszaken"
            items={verenigingsPages.map((page) => ({
              label: page.label,
              href: `/vereniging/${page.slug}`,
            }))}
            className="w-full sm:w-[18rem]"
          />
        </div>
        <div className="flex flex-col justify-center">{children}</div>
      </div>
    </main>
  );
}
