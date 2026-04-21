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
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import PageHero from "~/app/(public)/_components/style/page-hero";
import licentiestructuur from "./_assets/nwd-licentiestructuur.png";
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
  "Erkend voor zowel de eigenvaardigheidslijn (consumentendiploma's) als de instructeursopleidingen.",
  "Per 1 januari 2026 — samen met de Watersport Academy — de enige erkende opleidingsroute voor watersportinstructeurs in Nederland.",
];

const quickAnswerCards: QuickAnswerCard[] = [
  {
    title: "Internationaal via World Sailing",
    description:
      "World Sailing erkent dat het Watersportverbond een kwalitatief goed opleidingssysteem hanteert en geeft daarmee internationale waarde aan de diplomalijn.",
    icon: GlobeEuropeAfricaIcon,
  },
  {
    title: "NOC*NSF-erkenning via KSS",
    description:
      "De instructeursopleidingen vallen onder de Kwalificatiestructuur Sport (KSS) van NOC*NSF. Daarmee zijn instructeurskwalificaties zoals I-2, I-3 en I-4 ministerieel erkend als opleiding tot sportinstructeur.",
    icon: TrophyIcon,
  },
  {
    title: "NLQF-registratie",
    description:
      "De instructeursopleidingen worden ingeschaald in het Nederlands Kwalificatieraamwerk (NLQF). Dat geeft nationale overheidserkenning én automatisch een Europese EQF-waarde.",
    icon: BuildingLibraryIcon,
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Is het Nationaal Watersportdiploma officieel erkend?",
    answer:
      "Ja, maar het is goed om het onderscheid te maken. Voor de eigenvaardigheidslijn (de diploma's die watersporters halen) is de NWD-diplomalijn erkend door het Watersportverbond en door hen aangewezen als de standaard voor commerciële vaarscholen. Voor instructeursopleidingen is het Watersportverbond de directe licentiehouder in Nederland en steunt die autoriteit op drie licentiegevers: World Sailing (internationaal), NOC*NSF via de Kwalificatiestructuur Sport (ministerieel), en het NLQF (overheidserkenning met Europese EQF-waarde).",
  },
  {
    question:
      "Ik hoorde dat alleen NOC*NSF opleidingen mag erkennen — klopt dat?",
    answer:
      "NOC*NSF is de koepel van Nederlandse sportbonden en reikt via de Kwalificatiestructuur Sport (KSS) instructeurskwalificaties uit. De erkenning van de diplomalijn zelf loopt via de sportbond: het Koninklijk Nederlands Watersportverbond houdt de licentie voor watersportopleidingen in Nederland en heeft de NWD-diplomalijn aangewezen als de standaard voor commerciële vaaropleidingen.",
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
      "Nee. KSS-kwalificaties zijn onderdeel van een landelijk systeem en horen bij jou als persoon, niet bij een specifieke opleidingsroute. Als je je instructeursstatus op een erkende manier hebt behaald, blijft die automatisch geldig bij zowel NWD-vaarscholen als de Watersport Academy. Wel geldt: vanaf 1 januari 2026 kun je je kwalificatie alleen inzetten op door het Watersportverbond erkende opleidingslocaties, en nieuwe of hogere instructeurskwalificaties kun je uitsluitend daar behalen.",
  },
  {
    question: "Worden NWD-diploma's internationaal erkend?",
    answer:
      "Ja. Via World Sailing — de internationale zeilbond — heeft de NWD-diplomalijn internationale waarde. Voor instructeurs komt daar bovenop dat de kwalificaties in het NLQF zijn ingeschaald, wat automatisch een Europese EQF-waarde geeft en herkenbaarheid in heel Europa.",
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
    title: "Erkenningen: is het NWD officieel gelicentieerd?",
    description:
      "Een snelle check: het Nationaal Watersportdiploma is nationaal en internationaal erkend via het Koninklijk Nederlands Watersportverbond — de directe licentiehouder voor watersportopleidingen in Nederland.",
    alternates: {
      canonical: "/erkenningen",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Erkenningen: is het NWD officieel gelicentieerd?",
      description:
        "Een snelle check: het Nationaal Watersportdiploma is nationaal en internationaal erkend via het Koninklijk Nederlands Watersportverbond — de directe licentiehouder voor watersportopleidingen in Nederland.",
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
                Ja, het NWD is officieel erkend.
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
              Daarnaast worden de instructeursopleidingen bij NWD-locaties
              formeel erkend via drie licentiegevers.
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

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="grid gap-4">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Licentiestructuur</span>
              <Double />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-balance">
              Zo loopt de licentie tot aan jouw vaarlocatie
            </h2>
            <p className="text-base text-slate-600 sm:text-lg">
              Voor instructeursopleidingen is het Watersportverbond de directe
              licentiehouder in Nederland. Die autoriteit is opgebouwd uit drie
              licentiegevers: World Sailing (internationaal), NOC*NSF via de
              Kwalificatiestructuur Sport (ministerieel), en het NLQF
              (overheidserkenning met Europese EQF-waarde). Het Watersportverbond
              delegeert die licentie aan het NWD-opleidingssysteem en aan de
              Watersport Academy.
            </p>
            <p className="text-sm text-slate-500">
              Voor de eigenvaardigheidsdiploma's is de NWD-lijn door het
              Watersportverbond aangewezen als standaard voor commerciële
              vaarscholen. NWD bedient commerciële vaarscholen, de Watersport
              Academy bedient verenigingen, Scouting en Regionale Admiraliteiten
              — beide met exact dezelfde diplomalijn, structuur en eisen.
            </p>
          </div>
          <a
            href={licentiestructuur.src}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative mx-auto block w-full overflow-hidden rounded-xl bg-white p-4 sm:p-6 ring-1 ring-slate-200/70 transition hover:ring-branding-dark/40"
            aria-label="Open het schema van de licentiestructuur op volledig formaat"
          >
            <Image
              src={licentiestructuur}
              alt="Schema van de NWD-licentiestructuur: drie licentiegevers (World Sailing, NOC*NSF, NLQF) geven hun erkenning door aan het Watersportverbond, dat de diplomalijn uitgeeft via NWD-vaarscholen en de Watersport Academy."
              className="h-auto w-full"
              placeholder="blur"
            />
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-branding-dark/90 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-sm transition group-hover:opacity-100">
              Klik om te vergroten
            </span>
          </a>
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
                Licentiehouder
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Het Koninklijk Nederlands Watersportverbond is de directe
                licentiehouder voor watersportopleidingen en draagt als
                sportbond de eindverantwoordelijkheid voor de erkenning van de
                diplomalijn.
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
