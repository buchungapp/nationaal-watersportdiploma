import {
  BuildingLibraryIcon,
  CheckBadgeIcon,
  GlobeEuropeAfricaIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import Double from "~/app/_components/brand/double-line";
import FaqDisclosure from "~/app/(public)/_components/faq/faq";
import QualificationRoles from "~/app/(public)/_components/qualification-roles";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import PageHero from "~/app/(public)/_components/style/page-hero";
import nwdFlag from "./_assets/nwd-vlag.jpg";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface QuickAnswerCard {
  title: string;
  description: string;
  icon: IconType;
}

interface FaqItem {
  question: string;
  answer: string;
}

const heroPoints = [
  "De NWD-eigenvaardigheidslijn is erkend door het Watersportverbond.",
  "Kaderopleidingen volgen de Kwalificatiestructuur Sport van NOC*NSF, onder toezicht van het Watersportverbond.",
];

const quickAnswerCards: QuickAnswerCard[] = [
  {
    title: "Internationaal via World Sailing",
    description:
      "Het nationale zeilopleidingsprogramma van het Watersportverbond heeft de erkenning World Sailing Recognised Training. Het programma wordt getoetst aan internationale kwaliteitsstandaarden.",
    icon: GlobeEuropeAfricaIcon,
  },
  {
    title: "NOC*NSF-erkenning via KSS",
    description:
      "De kaderopleidingen volgen de Kwalificatiestructuur Sport (KSS) van NOC*NSF. Volgens het Watersportverbond zijn de kwalificatieprofielen en toetsing erkend door NOC*NSF en het ministerie van VWS.",
    icon: TrophyIcon,
  },
  {
    title: "NLQF-niveau-inschaling",
    description:
      "Het NCP NLQF stelt het niveau van de leeruitkomsten van een opleiding vast. Het bijbehorende EQF-niveau maakt dit niveau internationaal vergelijkbaar. Inschaling geeft geen overheidserkenning van de opleiding.",
    icon: BuildingLibraryIcon,
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Is het Nationaal Watersportdiploma officieel erkend?",
    answer:
      "Ja. Het Watersportverbond heeft de NWD-eigenvaardigheidslijn erkend als standaard. De kaderopleidingen volgen de Kwalificatiestructuur Sport (KSS) van NOC*NSF, onder toezicht van het Watersportverbond. Een NLQF/EQF-inschaling maakt daarnaast het niveau van een specifieke kaderkwalificatie vergelijkbaar. Die inschaling is geen erkenning van het NWD of van de opleiding door de overheid.",
  },
  {
    question: "Wat betekent een NLQF/EQF-inschaling?",
    answer:
      "Het laat zien op welk niveau de leeruitkomsten van de betreffende opleiding zijn ingeschaald. Dat helpt bij het vergelijken van opleidingen in Nederland en Europa. De inschaling is geen kwaliteitskeurmerk of accreditatie en geeft geen recht op een titel, automatische toelating tot vervolgonderwijs of beroepsuitoefening in een ander land. NWD-eigenvaardigheidsdiploma's hebben zelf geen NLQF-inschaling.",
  },
  {
    question:
      "Ik hoorde dat alleen NOC*NSF opleidingen mag erkennen — klopt dat?",
    answer:
      "Erkenning kan verschillende dingen betekenen. NOC*NSF stelt via de Kwalificatiestructuur Sport landelijke eisen aan kaderkwalificaties. Het Watersportverbond stelt de watersportspecifieke profielen vast, geeft kaderdiploma’s uit en erkent opleidingslocaties. Het heeft ook de NWD-eigenvaardigheidslijn erkend. Het NCP NLQF bepaalt het niveau van een opleiding; dat is een afzonderlijke taak.",
  },
  {
    question: "Wat is de relatie tussen NWD en het Watersportverbond?",
    answer:
      "Het NWD en het Watersportverbond zijn formele strategische partners en gezamenlijk eigenaar van het diplomasysteem. NWD bedient commerciële vaarscholen; de Watersport Academy van het Watersportverbond bedient verenigingen, Scouting en Regionale Admiraliteiten. Beide uitvoeringen bieden exact dezelfde inhoudelijke diplomalijn met identieke structuur en eisen.",
  },
  {
    question:
      "Ik heb mijn instructeurskwalificatie via CWO behaald — moet ik die opnieuw halen bij het NWD?",
    answer:
      "Eerder door het Watersportverbond uitgegeven KSS-kwalificaties behouden hun waarde en horen bij jou als persoon. Je hoeft ze niet opnieuw te behalen omdat je naar een NWD-locatie gaat. Voor opleiden en toetsen binnen dit KSS-stelsel gelden de actuele voorwaarden en erkenning of licentie van de locatie. Voor licenties op KSS-niveau 5 gelden ook her- en bijscholingsvoorwaarden. Een nieuw profiel geeft een ouder diploma niet automatisch een nieuw NLQF-niveau.",
  },
  {
    question: "Worden NWD-diploma's internationaal erkend?",
    answer:
      "Het nationale zeilopleidingsprogramma van het Watersportverbond heeft World Sailing Recognised Training-erkenning. Voor ingeschaalde kaderkwalificaties helpt het NLQF/EQF-niveau om het niveau internationaal te vergelijken. Dit betekent geen automatische erkenning van ieder diploma in elk land. Voor toelating, verhuur of werk kunnen aanvullende voorwaarden gelden.",
  },
  {
    question: "Hoe weet ik of een vaarlocatie erkend is?",
    answer:
      "Erkende opleidingslocaties zijn aangesloten bij het NWD of bij de Watersport Academy van het Watersportverbond. NWD-vaarlocaties herken je aan het NWD-logo en vind je via de officiële locatiezoeker op deze website.",
  },
];

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Erkenning en NLQF-inschaling van het NWD",
    description:
      "Het Watersportverbond erkent de NWD-diplomalijn. Lees wat erkenning door de sportorganisaties en NLQF/EQF-inschaling van kaderkwalificaties betekenen.",
    alternates: {
      canonical: "/erkenningen",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Erkenning en NLQF-inschaling van het NWD",
      description:
        "Het Watersportverbond erkent de NWD-diplomalijn. Lees wat erkenning door de sportorganisaties en NLQF/EQF-inschaling van kaderkwalificaties betekenen.",
      url: "/erkenningen",
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
        <div className="mx-auto grid w-full max-w-[1800px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-16 xl:px-20">
          <div className="grid gap-8">
            <div className="grid gap-3">
              <div className="flex items-center gap-x-3 font-bold uppercase text-white/70">
                <span className="whitespace-nowrap">Erkenningen</span>
                <Double className="text-white/50" />
              </div>
              <h1 className="max-w-4xl text-4xl font-bold text-white lg:text-5xl xl:text-6xl text-balance">
                Erkend door het Watersportverbond.
              </h1>
              <p className="max-w-3xl text-lg leading-relaxed text-slate-100">
                Het Koninklijk Nederlands Watersportverbond erkent de
                NWD-diplomalijn en heeft deze aangewezen als de standaard voor
                commerciële vaarscholen.
              </p>
            </div>

            <ul className="grid gap-3 text-left">
              {heroPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-white/95"
                >
                  <CheckBadgeIcon className="mt-0.5 size-5 shrink-0" />
                  <span className="text-sm sm:text-base">{point}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <BoxedButton
                href="/vaarlocaties"
                className="bg-white text-branding-dark font-bold"
              >
                Vind een erkende NWD-locatie
              </BoxedButton>
              <BoxedButton
                href="/actueel/8ODUCfRh-het-watersportlandschap-gaat-veranderen-een-duiding-van-de-feiten"
                className="text-white hover:bg-white/10"
              >
                Lees de volledige duiding
              </BoxedButton>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border-2 border-white/20 shadow-lg lg:aspect-[5/4]">
            <Image
              src={nwdFlag}
              alt="De NWD-vlag wappert boven een NWD-erkende vaarlocatie — symbool voor officiële erkenning door het Watersportverbond."
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
              placeholder="blur"
              priority
            />
          </div>
        </div>
      </PageHero>

      <main className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-16 px-4 pb-16 pt-12 lg:gap-24 lg:px-8">
        <section className="mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Hoe zit het precies?</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              De erkenning van het NWD in het kort
            </h2>
            <p className="max-w-3xl text-lg text-slate-600">
              De NWD-diplomalijn is de door het Watersportverbond aangewezen
              standaard voor de eigenvaardigheid bij commerciële vaarscholen.
              Voor de kaderopleidingen gelden landelijke KSS-eisen.
              Internationale programma-erkenning en NLQF-niveau-inschaling
              hebben ieder een eigen betekenis.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickAnswerCards.map(({ title, description, icon: Icon }) => (
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

        <section className="mx-auto w-full max-w-(--breakpoint-xl)">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-balance">
            Wie erkent wat en wie bepaalt het niveau?
          </h2>
          <QualificationRoles />
          <p className="text-base text-slate-600">
            Bekijk de{" "}
            <Link
              href="/diplomalijn/instructeur/erkenningen"
              className="font-semibold text-branding-dark underline underline-offset-2"
            >
              NLQF/EQF-niveaus per kaderkwalificatie
            </Link>{" "}
            en de bijbehorende bronnen.
          </p>
        </section>

        <section className="mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Strategisch partnership</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              NWD en Watersportverbond: samen eigenaar van het diplomasysteem
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Sportbond
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Het Koninklijk Nederlands Watersportverbond erkent de
                eigenvaardigheidslijn en houdt toezicht op de kaderopleidingen
                en toetsing binnen het gezamenlijke opleidingssysteem.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Mede-eigenaar
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                De Vereniging Nationaal Watersportdiploma heeft haar
                diplomasysteem ter beschikking gesteld en is gezamenlijk
                eigenaar geworden met het Watersportverbond.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Twee merknamen
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Het NWD bedient commerciële vaarscholen, de Watersport Academy
                bedient verenigingen en Scouting — met dezelfde gezamenlijke
                diplomalijn en kwaliteitseisen.
              </p>
            </article>
          </div>
        </section>

        <section
          id="veelgestelde-vragen"
          className="mx-auto w-full max-w-(--breakpoint-xl)"
        >
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Veelgestelde vragen</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Nog vragen over de erkenning?
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

        <section className="mx-auto w-full max-w-(--breakpoint-xl)">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Verder lezen
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Meer achtergrond bij de keuze voor het NWD als nieuwe landelijke
              standaard.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/actueel/8ODUCfRh-het-watersportlandschap-gaat-veranderen-een-duiding-van-de-feiten"
                className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
              >
                Duiding van de feiten (artikel)
              </Link>
              <Link
                href="/help/artikel/watersportverbond-kiest-voor-het-nwd-wat-betekent-dit-voor-jou"
                className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
              >
                Wat betekent dit voor jou?
              </Link>
              <Link
                href="/partners"
                className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
              >
                Over het Watersportverbond
              </Link>
              <Link
                href="/vaarlocaties/kwaliteitsgarantie"
                className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
              >
                Kwaliteitsgarantie
              </Link>
            </div>
          </div>
        </section>

        <section className="relative z-10 overflow-hidden rounded-2xl bg-branding-light py-12 sm:rounded-[3rem] sm:py-16">
          <div className="mx-auto grid max-w-(--breakpoint-lg) gap-4 px-6 text-center sm:px-8 lg:px-16">
            <h2 className="text-3xl font-bold text-white lg:text-5xl text-balance">
              Op zoek naar een erkende vaarlocatie?
            </h2>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
              Bekijk het overzicht van NWD-aangesloten vaarscholen en kies met
              vertrouwen voor een erkende opleiding.
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
