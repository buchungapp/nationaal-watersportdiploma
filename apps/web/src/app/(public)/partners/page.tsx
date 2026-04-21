import { ArrowUpRightIcon } from "@heroicons/react/20/solid";
import type { Metadata, ResolvingMetadata } from "next";
import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import PageHero from "~/app/(public)/_components/style/page-hero";
import buchung from "./_assets/buchung.png";
import watersportverbond from "./_assets/watersportverbond.png";

interface PartnerCardProps {
  name: string;
  role: string;
  logo: StaticImageData;
  logoAlt: string;
  children: ReactNode;
  links: Array<{ href: string; label: string }>;
}

function PartnerCard({
  name,
  role,
  logo,
  logoAlt,
  children,
  links,
}: PartnerCardProps) {
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex h-20 items-center justify-start">
        <Image
          src={logo}
          alt={logoAlt}
          className="max-h-20 w-auto max-w-[240px] object-contain object-left"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-2xl font-bold text-slate-900">{name}</h2>
        <span className="rounded-full bg-branding-dark/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-branding-dark">
          {role}
        </span>
      </div>
      <div className="space-y-3 text-base leading-relaxed text-slate-600">
        {children}
      </div>
      <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-branding-dark hover:text-branding-light"
          >
            {link.label}
            <ArrowUpRightIcon className="size-4" />
          </a>
        ))}
      </div>
    </article>
  );
}

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Partners",
    description: "Partijen waarmee het Nationaal Watersportdiploma samenwerkt.",
    alternates: {
      canonical: "/partners",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Partners",
      description:
        "Partijen waarmee het Nationaal Watersportdiploma samenwerkt.",
      url: "/partners",
    },
  };
}

export default function Page() {
  return (
    <main>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">
              Partners
            </h1>
            Partijen waarmee het Nationaal Watersportdiploma samenwerkt.
          </div>
        </div>
      </PageHero>
      <div className="mx-auto w-full max-w-(--breakpoint-xl) px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <PartnerCard
            name="Watersportverbond"
            role="Licentiehouder"
            logo={watersportverbond}
            logoAlt="Koninklijk Nederlands Watersportverbond"
            links={[
              {
                href: "https://www.watersportverbond.nl",
                label: "www.watersportverbond.nl",
              },
            ]}
          >
            <p>
              Het Koninklijk Nederlands Watersportverbond (Watersportverbond)
              waarborgt als autoriteit en licentiehouder binnen de
              watersportsector de kwaliteit van alle watersportopleidingen in
              Nederland, onder andere voor consumenten en instructeurs maar ook
              voor trainers en officials. Met ingang van 2024 werkt het
              Watersportverbond samen met het Nationaal Watersportdiploma (NWD).
            </p>
            <p>
              Het Watersportverbond verzorgt hierbij de licentie en erkenning
              voor de opleidingen van het NWD. Andersom werkt het NWD mee aan
              het verder ontwikkelen van het landschap van watersportopleidingen
              in Nederland.
            </p>
          </PartnerCard>

          <PartnerCard
            name="Buchung"
            role="Techniek & marketing"
            logo={buchung}
            logoAlt="Buchung"
            links={[
              {
                href: "https://www.buchungapp.com",
                label: "www.buchungapp.com",
              },
              {
                href: "https://nationaalwatersportdiploma.dev",
                label: "nationaalwatersportdiploma.dev",
              },
            ]}
          >
            <p>
              Buchung ontwikkelt en onderhoudt de volledige technische
              infrastructuur van het Nationaal Watersportdiploma — van de
              publieke website tot het opleidingsplatform waarop instructeurs
              en vaarscholen werken — en verzorgt daarnaast de marketing voor
              het NWD.
            </p>
            <p>
              De broncode van het NWD-platform is open source en vrij in te
              zien en te gebruiken via nationaalwatersportdiploma.dev. Daarmee
              is de techniek achter het diplomasysteem transparant en toetsbaar
              voor de hele sector.
            </p>
          </PartnerCard>
        </div>
      </div>
    </main>
  );
}
