import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  LifebuoyIcon,
} from "@heroicons/react/24/outline";
import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Double from "~/app/_components/brand/double-line";
import FaqDisclosure from "~/app/(public)/_components/faq/faq";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { CostComparison } from "~/app/(public)/_components/cost-comparison";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Voor vaarlocaties",
    description:
      "Overweeg je aansluiting bij het NWD? Bekijk de routes, kosten, erkenningen en de aansluitprocedure voor seizoen 2026.",
    alternates: {
      canonical: "/voor-vaarlocaties",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Voor vaarlocaties",
      description:
        "Overweeg je aansluiting bij het NWD? Bekijk de routes, kosten, erkenningen en de aansluitprocedure voor seizoen 2026.",
      url: "/voor-vaarlocaties",
    },
  };
}

const whyNowArticles = [
  {
    title:
      "Een keuze, vier routes: wat elke commerciele vaarschool moet weten voor 2026",
    href: "/actueel/Xk7mPw2Q-een-keuze-vier-routes-commerciele-vaarscholen-2026",
    date: "10 februari 2026",
    summary:
      "Vergelijk de vier scenario's op kosten, erkenning, ondersteuning en toekomstperspectief.",
  },
  {
    title:
      "Richtlijnen 2026: de standaard is er, en waar NWD verder gaat",
    href: "/actueel/i62T54pW-richtlijnen-2026-de-standaard-is-er-wij-doen-meer",
    date: "8 februari 2026",
    summary:
      "Wat verandert er in het kwaliteitskader en wat betekent dit voor jouw locatie in 2026?",
  },
] as const;

const nwdReasons = [
  {
    title: "Vereniging in plaats van over je hoofd beslissen",
    description:
      "Als lid heb je via de ALV directe inspraak op diplomalijn, IT en kwaliteitsontwikkeling.",
  },
  {
    title: "Gebouwd voor commerciele vaarscholen",
    description:
      "Het systeem ondersteunt efficiënte registraties op schaal en sluit aan op de praktijk van grotere locaties.",
  },
  {
    title: "Gezamenlijke marketing en community",
    description:
      "Je investeert mee in promotie voor de hele sector en leert van andere locaties tijdens trainingsmomenten.",
  },
  {
    title: "Kwaliteit met begeleiding",
    description:
      "We combineren duidelijke eisen met een praktische onboarding voor jou en je instructeurs.",
  },
] as const;

const scenarioSteps = {
  cwo: [
    "Inventariseer welke instructeurs al via de KSS geaccrediteerd zijn.",
    "Plan de intake en stem de overgang op jouw seizoen en team af.",
    "Start met onboarding, inrichting en uitrol met ondersteuning van het secretariaat.",
  ],
  newLocation: [
    "Breng in kaart welke KSS-competenties je al in huis hebt.",
    "Maak een realistisch opleidingsplan voor ontbrekende instructeurskwalificaties.",
    "Start je aansluiting zodra de basis op orde is; wij helpen met planning en uitvoering.",
  ],
} as const;

const faqItems = [
  {
    question: "Wat kost aansluiten bij het NWD?",
    answer:
      "De actuele kosten staan in de vergelijkingstabel op deze pagina. Daarin zie je jaarlijkse kosten, eenmalige kosten en kosten per diploma voor alle relevante routes.",
  },
  {
    question: "Hoe lang duurt de aansluitprocedure gemiddeld?",
    answer:
      "Dat hangt af van je startsituatie. Locaties met een sterk ingericht team en bestaande KSS-ervaring kunnen sneller schakelen. In een intakegesprek maken we een planning op maat.",
  },
  {
    question: "Kunnen we direct door als we nu vanuit CWO overstappen?",
    answer:
      "Vaak wel, zeker als je instructeurs al aantoonbaar via de KSS zijn opgeleid. Dat versnelt de overstap aanzienlijk.",
  },
  {
    question: "Wat als we nog geen volledig KSS-opgeleid team hebben?",
    answer:
      "Dan maken we eerst een ontwikkelplan. We helpen je met een praktische route, eventueel met ondersteuning vanuit andere vaarlocaties.",
  },
  {
    question: "Wat is het verschil tussen NWD en de andere routes?",
    answer:
      "NWD combineert de landelijke standaard met verenigingsinspraak, commerciële praktijkondersteuning, gezamenlijke marketing en een actieve community van locaties en instructeurs.",
  },
  {
    question: "Kunnen jullie helpen met onboarding van instructeurs?",
    answer:
      "Ja. We hebben een onboardingpakket en begeleiding voor zowel locatie als instructeurs, zodat je overgang werkbaar blijft tijdens het seizoen.",
  },
  {
    question: "Waarom is 1 april 2026 zo belangrijk?",
    answer:
      "Omdat dat de intake-deadline is om nog dit vaarseizoen (2026) aan te sluiten met een realistische implementatieplanning.",
  },
] as const;

export default function Page() {
  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 items-center gap-8 px-4 sm:px-8 lg:grid-cols-[1fr_380px] lg:gap-12 lg:px-16 xl:px-20">
          <div className="grid gap-6 text-white">
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-medium">
              <ClockIcon className="size-4" />
              Intake sluit op 1 april 2026
            </div>
            <h1 className="max-w-3xl text-4xl font-bold text-balance lg:text-5xl xl:text-6xl">
              Voor vaarlocaties die nu een heldere keuze willen maken
            </h1>
            <p className="max-w-3xl text-lg text-slate-100 leading-relaxed">
              Overweeg je aansluiting bij het NWD? We snappen dat dit een
              belangrijk keuzemoment is. Daarom krijg je hier de feiten,
              scenario&apos;s en vervolgstappen op een rij, zonder ruis.
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <BoxedButton
                href="/contact"
                className="bg-white text-branding-dark font-bold"
              >
                Plan een gesprek op maat
              </BoxedButton>
              <Link
                href="/help/artikel/hoe-werkt-de-aansluitingsprocedure-van-het-nwd"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Bekijk de aansluitprocedure
                <ArrowTopRightOnSquareIcon className="size-4" />
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/25 bg-white/10 p-6 text-white backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Deadline voor seizoen 2026
            </p>
            <p className="mt-2 text-3xl font-bold">1 april 2026</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-100">
              Wil je nog dit vaarseizoen aansluiten? Neem op tijd contact op met
              het secretariaat voor een realistische planning van intake,
              onboarding en uitrol.
            </p>
            <BoxedButton
              href="/contact"
              className="mt-5 bg-branding-orange text-white"
            >
              Neem contact op met secretariaat
            </BoxedButton>
          </aside>
        </div>
      </PageHero>

      <div className="mx-auto mt-8 flex w-full max-w-(--breakpoint-2xl) flex-col gap-16 px-4 pb-16 lg:mt-12 lg:gap-24 lg:px-8">
        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 lg:gap-12">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Waarom nu kiezen</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              De feiten zijn helder, het moment ook
            </h2>
            <p className="max-w-3xl text-lg text-slate-600 text-pretty">
              In februari 2026 zijn de kaders voor de sector concreet gemaakt.
              Deze twee artikelen geven je in korte tijd het volledige overzicht.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {whyNowArticles.map((article) => (
              <article
                key={article.href}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {article.date}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {article.summary}
                </p>
                <Link
                  href={article.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-branding-dark hover:underline"
                >
                  Lees artikel
                  <ArrowTopRightOnSquareIcon className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 lg:gap-12">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Filosofie en structuur</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Zelfverzekerd in koers, helpend in uitvoering
            </h2>
            <p className="max-w-3xl text-lg text-slate-600 text-pretty">
              We zijn een vereniging met een duidelijke visie op veiligheid,
              kwaliteit en plezier op het water. Je kunt onze basis en
              governance volledig transparant terugvinden.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {nwdReasons.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <h3 className="text-base font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/vereniging/manifest"
              className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
            >
              Manifest
            </Link>
            <Link
              href="/vereniging/bestuur"
              className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
            >
              Bestuur
            </Link>
            <Link
              href="/vereniging/kwaliteitscommissie"
              className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
            >
              Kwaliteitscommissie
            </Link>
            <Link
              href="/vereniging/secretariaat"
              className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
            >
              Secretariaat
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-5">
          <div className="grid gap-2">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Kostenvergelijking</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Wat krijg je voor je investering?
            </h2>
            <p className="max-w-3xl text-lg text-slate-600">
              Vergelijk de routes op kosten, erkenning en ondersteuning, en
              kies de route die past bij jouw locatie en seizoenplanning.
            </p>
          </div>
          <CostComparison />
          <Link
            href="/actueel/Xk7mPw2Q-een-keuze-vier-routes-commerciele-vaarscholen-2026"
            className="w-fit text-sm font-semibold text-branding-dark hover:underline"
          >
            Lees de volledige context bij deze vergelijking
          </Link>
        </section>

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 lg:gap-12">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Twee scenario&apos;s</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Jouw startpunt bepaalt het tempo, niet de richting
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border-2 border-branding-light/20 bg-branding-light/5 p-6 sm:p-8">
              <h3 className="text-xl font-bold text-branding-dark">
                Overstappen vanaf CWO
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Voor locaties die al met CWO werken en de overstap naar NWD
                willen maken zonder onnodige vertraging.
              </p>
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Als je instructeurs al via de KSS geaccrediteerd zijn, is
                versnelde instroom meestal mogelijk.
              </p>
              <ol className="mt-5 grid gap-3 text-sm text-slate-700">
                {scenarioSteps.cwo.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-branding-dark text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <BoxedButton href="/contact" className="mt-6 bg-white text-branding-dark">
                Bespreek mijn overstap
              </BoxedButton>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-900">
                Starten als nieuwe erkende locatie
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Voor locaties die nog geen directe CWO-overgang hebben, maar wel
                erkend en toekomstbestendig willen opleiden.
              </p>
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Heb je nog niet de juiste KSS-opgeleide mensen? Dan maken we
                eerst een haalbaar plan voor opleiding en implementatie.
              </p>
              <ol className="mt-5 grid gap-3 text-sm text-slate-700">
                {scenarioSteps.newLocation.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <BoxedButton href="/contact" className="mt-6 bg-branding-dark text-white">
                Maak een opstartplan
              </BoxedButton>
            </article>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Diplomalijn in de praktijk</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Een moderne, modulaire lijn die werkt op het water
            </h2>
            <p className="text-lg text-slate-600">
              Het NWD werkt met een flexibele diplomalijn die realistisch is voor
              instructeurs en motiverend voor cursisten. Bekijk de video en lees
              daarna het volledige artikel met alle details.
            </p>
            <Link
              href="/help/artikel/hoe-is-de-diplomalijn-van-het-nwd-opgebouwd"
              className="mt-2 w-fit text-sm font-semibold text-branding-dark hover:underline"
            >
              Bekijk het volledige helpartikel over de diplomalijn
            </Link>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
            <iframe
              src="https://www.youtube-nocookie.com/embed/3_R9Ah_ZtXA"
              title="Hoe is de diplomalijn van het NWD opgebouwd"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 lg:gap-12">
          <div className="grid gap-3">
            <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
              <span className="whitespace-nowrap">Erkenningen en KSS</span>
              <Double />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              De basis is landelijk, jouw uitvoering blijft ondernemend
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-bold text-slate-900">Erkende lijn</h3>
              <p className="mt-2 text-sm text-slate-600">
                NWD is onderdeel van de landelijke structuur met duidelijke
                kwaliteitskaders voor opleidingslocaties.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-bold text-slate-900">KSS in de praktijk</h3>
              <p className="mt-2 text-sm text-slate-600">
                KSS-kwalificaties blijven cruciaal voor erkend opleiden. Wij
                helpen je om dit praktisch in je organisatie te borgen.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-bold text-slate-900">Transparant kader</h3>
              <p className="mt-2 text-sm text-slate-600">
                Je weet vooraf waar je aan toe bent qua eisen, proces en
                begeleiding richting seizoenstart.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/help/artikel/watersportverbond-kiest-voor-het-nwd-wat-betekent-dit-voor-jou"
              className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
            >
              Meer over licentiestructuur
            </Link>
            <Link
              href="/partners"
              className="rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10"
            >
              Bekijk partners en samenwerking
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-branding-dark">
              <LifebuoyIcon className="size-5" />
              <h2 className="text-lg font-bold">Aansluitprocedure</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              We maken de overstap beheersbaar met een duidelijke intake,
              praktische onboarding en begeleiding voor zowel locatie als
              instructeurs.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                Intake op jouw situatie en planning
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                Onboardingpakket voor team en operatie
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                Ondersteuning bij implementatie en uitrol
              </li>
            </ul>
            <Link
              href="/help/artikel/hoe-werkt-de-aansluitingsprocedure-van-het-nwd"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-branding-dark hover:underline"
            >
              Lees de volledige aansluitprocedure
              <ArrowTopRightOnSquareIcon className="size-4" />
            </Link>
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3">
              <Image
                src="/images/aansluitingsprocedure/20250923-aansluitprocedure-nwd.png"
                alt="Schematische weergave van de NWD-aansluitprocedure"
                width={1200}
                height={3668}
                className="mx-auto h-auto max-h-80 w-auto rounded-md sm:max-h-96"
                sizes="(min-width: 640px) 360px, 100vw"
              />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">Veelgestelde vragen</h2>
            <dl className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {faqItems.map((faq, index) => (
                <FaqDisclosure
                  key={faq.question}
                  question={faq.question}
                  defaultOpen={index === 0}
                >
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </FaqDisclosure>
              ))}
            </dl>
          </article>
        </section>

        <section className="relative z-10 overflow-hidden rounded-2xl bg-branding-dark py-12 sm:rounded-[3rem] sm:py-16">
          <div className="mx-auto grid max-w-(--breakpoint-xl) gap-6 px-6 text-center sm:px-8 lg:px-12">
            <h2 className="text-3xl font-bold text-white text-balance sm:text-4xl">
              Sluit je voor 1 april 2026 aan voor dit vaarseizoen
            </h2>
            <p className="mx-auto max-w-3xl text-slate-200 text-lg leading-relaxed">
              Plan een vrijblijvend gesprek met het secretariaat. We bespreken je
              situatie, je team en een realistische route naar aansluiting.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <BoxedButton
                href="/contact"
                className="bg-white text-branding-dark font-bold"
              >
                Neem contact op voor plan op maat
              </BoxedButton>
              <Link
                href="/vereniging/secretariaat"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Meer over het secretariaat
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
