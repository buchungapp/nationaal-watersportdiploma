import {
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import Double from "~/app/_components/brand/double-line";
import FaqDisclosure from "~/app/(public)/_components/faq/faq";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import PageHero from "~/app/(public)/_components/style/page-hero";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface GuaranteeCard {
  title: string;
  description: string;
  icon: IconType;
}

interface AssuranceStep {
  title: string;
  description: string;
}

interface ExampleColumn {
  title: string;
  points: string[];
}

interface FaqItem {
  question: string;
  answer: string;
}

const heroPoints = [
  "Strenge veiligheids- en kwaliteitsnormen voor elke aangesloten locatie",
  "Aandacht voor persoonlijke en sociale veiligheid, niet alleen op het water",
  "Leren op een plek waar plezier, groei en vertrouwen samenkomen",
];

const guaranteeCards: GuaranteeCard[] = [
  {
    title: "Veiligheidsmaatregelen op het water",
    description:
      "Cursisten varen met passende CE-gekeurde vesten, heldere helmkaders en een rescuevloot die past bij vaarwater, boottypen en omstandigheden.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Sociale veiligheid voor iedereen",
    description:
      "Gedragscode, VOG-verplichtingen en een vertrouwenspersoon maken sociale veiligheid zichtbaar en bespreekbaar voor cursisten en teams.",
    icon: UserGroupIcon,
  },
  {
    title: "Wettelijke basis op orde",
    description:
      "NWD-locaties borgen belangrijke randvoorwaarden zoals brandveiligheid, verzekeringen, legionella-aanpak en voedselveiligheid.",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: "Deskundige instructeurs",
    description:
      "Locaties investeren in opleiding, her- en bijscholing en werken met gekwalificeerde kaderstaf om leskwaliteit hoog te houden.",
    icon: AcademicCapIcon,
  },
  {
    title: "Materiaal dat je kunt vertrouwen",
    description:
      "Lesboten en ondersteunend materiaal worden onderhouden zodat cursisten veilig kunnen oefenen en hun leerproces niet stilvalt.",
    icon: WrenchScrewdriverIcon,
  },
  {
    title: "Veiligheid, kwaliteit én plezier",
    description:
      "De NWD-standaard gaat verder dan regels alleen: hij ondersteunt een leeromgeving waarin mensen groeien met vertrouwen en plezier.",
    icon: SparklesIcon,
  },
];

const assuranceSteps: AssuranceStep[] = [
  {
    title: "Instap met duidelijke startvoorwaarden",
    description:
      "Nieuwe locaties leveren bewijsstukken aan over bedrijfsvoering, wetgeving en kwaliteitskaders voordat ze kunnen toetreden.",
  },
  {
    title: "Verdieping via gesprek en toetsing",
    description:
      "Na dossiercontrole volgt een inhoudelijk gesprek, inclusief toetsing op wet- en regelgeving en praktische invulling van eisen.",
  },
  {
    title: "Onafhankelijk advies en bestuursbesluit",
    description:
      "De kwaliteitscommissie adviseert en het bestuur neemt formeel een besluit over toetreding van nieuwe leden.",
  },
  {
    title: "Doorlopende controleerbaarheid",
    description:
      "Locaties houden relevante documentatie beschikbaar en werken mee aan controles om de afgesproken standaard blijvend te borgen.",
  },
];

const philosophyPillars = [
  {
    title: "Veiligheid voorop",
    description:
      "Veiligheid betekent bij NWD zowel materiële als sociale veiligheid, met duidelijke kaders voor gedrag, begeleiding en uitrusting.",
  },
  {
    title: "Kwaliteit als basis",
    description:
      "Kwaliteit zit in instructeurs, materiaal, ratio's en structurele ontwikkeling van locaties die actief blijven verbeteren.",
  },
  {
    title: "Plezier staat centraal",
    description:
      "Leren gaat beter als mensen zich veilig en gemotiveerd voelen. Daarom hoort plezier net zo nadrukkelijk bij de standaard.",
  },
];

const exampleColumns: ExampleColumn[] = [
  {
    title: "Veiligheid & gezondheid",
    points: [
      "CE-gekeurde zwem- of reddingsvesten passend bij lengte en gewicht",
      "Helmgebruik volgens duidelijke kaders en omstandigheden",
      "Rookvrij beleid en strikte grenzen rond alcohol, soft- en harddrugs",
      "VOG-verplichtingen en jaarlijks ondertekende gedragscode",
    ],
  },
  {
    title: "Wet- en regelgeving",
    points: [
      "Belangrijke verzekeringen, inclusief aandacht voor insolventierisico",
      "Aandacht voor brandveiligheid en relevante certificering",
      "Legionella-preventie en opvolging bij overschrijdingen",
      "HACCP-werkwijze voor keuken en voedselveiligheid",
    ],
  },
  {
    title: "Leskwaliteit & begeleiding",
    points: [
      "Ratio's voor instructeurs, cursisten, lesboten en volgboten",
      "Rescuecapaciteit en reddingsinventaris passend bij de situatie",
      "Her- en bijscholing voor teams op NWD-locaties",
      "Minimaal één aanwezige met I-4 of Opleider-kwalificatie tijdens NWD-activiteiten",
    ],
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Hoe herken ik een NWD-erkende locatie?",
    answer:
      "Je herkent een NWD-locatie aan het NWD-logo en aan de vermelding in de officiële locatiezoeker op deze website.",
  },
  {
    question: "Gaat deze garantie alleen over veiligheid op het water?",
    answer:
      "Nee. De NWD-kwaliteitsgarantie kijkt ook naar sociale veiligheid, accommodaties, verzekeringen, leskwaliteit en begeleiding.",
  },
  {
    question: "Waar kan ik terecht als ik zorgen heb over gedrag of integriteit?",
    answer:
      "Je kunt terecht bij de vertrouwenscontactpersoon van de locatie en daarnaast bij de onafhankelijke vertrouwenspersoon van het NWD.",
  },
  {
    question: "Waarom is de NWD-standaard breder dan alleen lesinhoud?",
    answer:
      "Omdat een goede cursus meer is dan techniek alleen. Een veilige en plezierige leeromgeving vraagt ook om sterke randvoorwaarden buiten de les zelf.",
  },
];

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Kwaliteitsgarantie voor veilig en leuk leren varen",
    description:
      "Ontdek de NWD-kwaliteitsgarantie: heldere afspraken over veiligheid, kwaliteit en plezier bij aangesloten vaarlocaties.",
    alternates: {
      canonical: "/vaarlocaties/kwaliteitsgarantie",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Kwaliteitsgarantie voor veilig en leuk leren varen",
      description:
        "Ontdek de NWD-kwaliteitsgarantie: heldere afspraken over veiligheid, kwaliteit en plezier bij aangesloten vaarlocaties.",
      url: "/vaarlocaties/kwaliteitsgarantie",
    },
  };
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />

      <PageHero>
        <div className="mx-auto grid w-full max-w-[1800px] gap-8 px-4 sm:px-8 lg:px-16 xl:px-20">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-white/70">
              <span className="whitespace-nowrap">NWD kwaliteitsbelofte</span>
              <Double className="text-white/50" />
            </div>
            <h1 className="max-w-4xl text-4xl font-bold text-white lg:text-5xl xl:text-6xl text-balance">
              Veilig, goed geregeld en vooral leuk leren varen.
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-100">
              Sinds 1 januari 2026 is de NWD-diplomalijn door het
              Watersportverbond aangewezen als erkende standaard voor
              commerciële vaaropleidingen. Dat betekent voor jou: heldere
              kwaliteitskaders voor veiligheid, begeleiding en leerplezier.
            </p>
          </div>

          <ul className="grid gap-3 text-left">
            {heroPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-white/95">
                <ShieldCheckIcon className="mt-0.5 size-5 shrink-0" />
                <span className="text-sm sm:text-base">{point}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <BoxedButton
              href="/vaarlocaties"
              className="bg-white text-branding-dark font-bold"
            >
              Vind een NWD-vaarlocatie
            </BoxedButton>
            <BoxedButton
              href="/vereniging/manifest"
              className="text-white hover:bg-white/10"
            >
              Lees het manifest
            </BoxedButton>
          </div>
        </div>
      </PageHero>

      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-16 px-4 pb-16 pt-12 lg:gap-24 lg:px-8">
        <section className="mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">
                Wat je mag verwachten
              </span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              De NWD-kwaliteitsgarantie in de praktijk
            </h2>
            <p className="max-w-3xl text-lg text-slate-600">
              Bij een NWD-locatie draait kwaliteit om het totaalplaatje: van
              sociale veiligheid en accommodatie tot leskwaliteit op het water.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guaranteeCards.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-xl border border-slate-200 p-5 sm:p-6 transition-colors hover:border-slate-300 hover:bg-slate-50/50"
              >
                <div className="inline-flex rounded-full bg-blue-50 p-3 text-branding-dark">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Hoe wij borgen</span>
              <Double />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-balance">
              Zo borgen we kwaliteit bij aangesloten locaties
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-2">
            {assuranceSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-branding-light/10 text-sm font-bold text-branding-dark">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">NWD-filosofie</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Meer dan regels: de belofte achter het NWD
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {philosophyPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-xl border border-slate-200 p-5 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-6 rounded-2xl bg-branding-dark p-6 text-white sm:p-8 md:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <LifebuoyIcon className="size-4" />
              Sociale veiligheid
            </div>
            <h2 className="text-2xl font-bold text-balance">
              Hulp en bescherming als dat nodig is
            </h2>
            <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
              Sociale veiligheid is een vast onderdeel van de NWD-standaard.
              Daarom werken locaties met gedragscodes en een interne én externe
              onafhankelijke vertrouwenspersoon, zodat zorgen snel en
              zorgvuldig kunnen worden opgepakt.
            </p>
          </div>
          <div className="grid content-start gap-3">
            <Link
              href="/vereniging/vertrouwenspersoon"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-branding-dark transition-colors hover:bg-slate-100"
            >
              Naar de vertrouwenspersoon
            </Link>
            <Link
              href="/vereniging/gedragscode"
              className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Bekijk de gedragscode
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="grid gap-3">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Concrete voorbeelden van wat wij borgen
            </h2>
            <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
              Onderstaande voorbeelden zijn gebaseerd op het actuele
              kwaliteitskader en laten zien wat je als consument mag verwachten.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {exampleColumns.map((column) => (
              <article
                key={column.title}
                className="rounded-xl border border-slate-200 p-5 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {column.title}
                </h3>
                <ul className="mt-3 grid gap-2">
                  {column.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex size-1.5 shrink-0 rounded-full bg-branding-light" />
                      <span className="text-sm leading-relaxed text-slate-600">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="veelgestelde-vragen" className="mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Veelgestelde vragen</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Nog vragen over de kwaliteitsgarantie?
            </h2>
          </div>
          <dl className="mt-8 divide-y divide-slate-900/10 rounded-lg border border-slate-900/10">
            {faqItems.map((item, index) => (
              <FaqDisclosure
                key={item.question}
                question={item.question}
                defaultOpen={index === 0}
              >
                <p className="text-sm text-slate-600 sm:text-base">
                  {item.answer}
                </p>
              </FaqDisclosure>
            ))}
          </dl>
        </section>

        <section className="relative z-10 overflow-hidden rounded-2xl bg-branding-light py-12 sm:rounded-[3rem] sm:py-16">
          <div className="mx-auto grid max-w-(--breakpoint-lg) gap-4 px-6 text-center sm:px-8 lg:px-16">
            <h2 className="text-3xl font-bold text-white lg:text-5xl text-balance">
              Klaar voor een veilige en leuke tijd op het water?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Kies een NWD-locatie en ervaar zelf hoe veiligheid, kwaliteit en
              plezier samenkomen in elke cursus.
            </p>
            <div className="mt-3 flex justify-center">
              <BoxedButton
                href="/vaarlocaties"
                className="bg-white text-branding-dark font-bold"
              >
                Bekijk alle NWD-vaarlocaties
              </BoxedButton>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
