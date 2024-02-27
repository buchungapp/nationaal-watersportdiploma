import { clsx } from "clsx";
import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { H3 } from "~/app/_components/typography";
import Wave from "~/app/_components/wave";
import nwdIcon from "./_assets/nwd-s.png";
import nwdFlag from "./_assets/nwd_flag.svg";
import headerImage from "./_assets/nwd_hero_cover-2.jpg";

function Hero() {
  return (
    <div className="relative flex w-full flex-col justify-end overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-48 overflow-hidden sm:h-60 md:h-72 lg:h-96">
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <svg
              className="absolute inset-x-0 -bottom-[45px] text-[#fdfaf8] sm:-bottom-[60px] md:-bottom-[75px] lg:-bottom-[110px] xl:-bottom-[140px]"
              viewBox="0 0 1512 434"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 433.44H1512V231.872C720.901 231.879 268.333 0 0 0V433.44Z"
                fill="currentColor"
              />
            </svg>
            <svg
              className="absolute inset-x-0 bottom-[10px] translate-y-20 text-[#fdfaf8] sm:bottom-0 md:-bottom-[20px] lg:-bottom-[55px] xl:-bottom-[90px]"
              viewBox="0 0 1512 434"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 433.44H1512V231.872C720.901 231.879 268.333 0 0 0V433.44Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        <Image
          src={headerImage}
          alt=""
          priority
          className="h-full object-cover object-center rounded-t-2xl"
        />
      </div>

      <div className="relative flex flex-col items-center justify-between gap-y-4 px-6 pt-20 sm:pt-32 md:flex-row md:items-end md:pt-40 lg:px-24 lg:pt-64">
        <div>
          <h1 className="text-center text-xl font-bold uppercase leading-tight text-brand-orange md:text-left">
            <span className="font-normal">Nationaal</span> Watersportdiploma
          </h1>
          <h2 className="mt-4 max-w-prose text-center text-2xl font-bold leading-tight text-neutral-900 sm:mt-2.5 sm:text-3xl md:text-left md:text-4xl lg:text-5xl">
            <Balancer>De nieuwe standaard in veiligheid, kwaliteit en plezier.</Balancer>
          </h2>
          <Wave className="mx-auto mt-2.5 h-3.5 text-brand-light-blue md:ml-0 lg:h-6" />
        </div>
        <Image
          src={nwdIcon}
          priority
          alt=""
          className="-order-1 aspect-square w-52 rounded-full shadow-xl md:order-none md:w-60"
        />
      </div>

      <div className="mt-12 flex justify-center sm:mt-16">
        <Link
          href="#manifest"
          className="flex items-center rounded-full bg-brand-light-blue hover:bg-brand-dark-blue px-4 py-2 font-medium text-white"
        >
          Lees ons manifest
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="ml-2.5 h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function Features() {
  const features = [
    {
      name: "Veiligheid voorop.",
      description:
        "Een veilige omgeving voor iedereen, met aandacht voor fysieke en sociale veiligheid.",
      color: "bg-brand-dark-blue",
      border: "border-brand-dark-blue",
    },
    {
      name: "Kwaliteit als basis.",
      description:
        "Moderne materialen, hooggekwalificeerde instructeurs, strenge kwaliteitsnormen.",
      color: "bg-brand-light-blue",
      border: "border-brand-light-blue",
    },
    {
      name: "Plezier staat centraal.",
      description:
        "Leren watersporten moet leuk zijn, met heldere stappen naar je volgende diploma en vele succesmomenten.",
      color: "bg-brand-orange",
      border: "border-brand-orange",
    },
  ];

  return (
    <dl className="mb-12 mt-16 grid gap-x-8 gap-y-8 px-6 sm:mt-28 sm:gap-y-12 lg:grid-cols-3 lg:px-24">
      {features.map((feature) => (
        <div
          key={feature.name}
          className={clsx(
            "flex flex-col overflow-hidden rounded-lg border-2 bg-white p-4 shadow-inner",
            feature.border,
          )}
        >
          {/* <div className="absolute -inset-1 bg-white rounded-sm" /> */}

          <dt className="text-base font-semibold leading-7 text-gray-900">
            <div className={clsx("mb-4 h-5 w-5 rounded-full", feature.color)} aria-hidden="true" />
            {feature.name}
          </dt>
          <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
            <p className="flex-auto">{feature.description}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Manifest() {
  const classNameBlock = "mt-10 space-y-2";
  const classNameParagraph = "text-justify";

  return (
    <div
      id="manifest"
      className="relative mx-2.5 mt-16 w-fit rounded-sm bg-white py-8 shadow sm:mx-auto md:py-14 lg:px-28 lg:py-20"
    >
      <div className="absolute -top-[2px] left-6 h-auto w-20 md:left-8 md:w-24 lg:left-12 lg:w-32 xl:left-16">
        <Image src={nwdFlag} alt="" className="object-contain" />
      </div>

      <div className="mx-auto max-w-prose px-6 md:px-8">
        <div className="space-y-1.5 pl-24 text-left md:pl-32 lg:pl-28">
          <h2 className="text-lg uppercase leading-tight text-brand-dark-blue sm:text-2xl md:text-3xl">
            <span>Nationaal</span> <span className="font-bold">Watersportdiploma</span>
          </h2>
          {/* <p>&#8212;</p> */}
          <p className="text-lg text-neutral-900 sm:text-xl md:text-2xl">Merkmanifest</p>
        </div>

        <div className="pt-16 sm:pt-24 md:pt-16 lg:pt-36">
          {/* Dropcap first letter */}
          <p className="text-justify first-letter:float-left first-letter:mr-1.5 first-letter:text-5xl first-letter:font-bold">
            De afgelopen jaren hebben de leidende zeilscholen van Nederland, verenigd door een
            gedeelde visie op vooruitgang, elkaar steeds vaker opgezocht. Samen zijn we overtuigd
            dat het nu tijd is om de lat hoger te leggen en actief te blijven doorontwikkelen om de
            toekomst van de watersport te vormen.
          </p>
          <p className={clsx(classNameParagraph, "mt-4")}>
            Het resultaat is het Nationaal Watersportdiploma (NWD). Met een scherpe focus op
            veiligheid, kwaliteit en plezier voor elke watersporter, overstijgt het NWD de
            traditionele functie van een keurmerk of diplomalijn.
          </p>
        </div>

        <div className="space-y-10">
          <div className={classNameBlock}>
            <H3>Veiligheid voorop.</H3>
            <p className={classNameParagraph}>
              Veiligheid is allesomvattend binnen het NWD: van de standaarduitrusting, tot een breed
              spectrum aan persoonlijke en sociale veiligheid. Elke aangesloten locatie voldoet niet
              alleen aan essentiële veiligheidseisen, maar schept ook een omgeving waarin iedereen
              zich welkom en veilig voelt. De inzet van een vertrouwenspersoon en een gedragscode,
              die jaarlijks door alle betrokkenen wordt ondertekend, versterkt onze toewijding aan
              een veilige, respectvolle watersportgemeenschap.
            </p>
          </div>

          <div className={classNameBlock}>
            <H3>Kwaliteit als basis.</H3>
            <p className={classNameParagraph}>
              Kwaliteit toont zich in verschillende facetten: van het gebruik van goed onderhouden
              en moderne materialen, tot de aanwezigheid van hooggekwalificeerde instructeurs die
              regelmatig bijscholing ontvangen. We bevorderen een cultuur van constante verbetering,
              waarbij locaties materiaal uitwisselen, gezamenlijke trainingsdagen organiseren, en
              elkaar uitdagen om de beste in de branche te zijn.
            </p>
          </div>

          <div className={classNameBlock}>
            <H3>Plezier staat centraal.</H3>
            <p className={classNameParagraph}>
              Plezier staat centraal in alles wat we doen. We geloven dat succes in de watersport
              niet alleen wordt gemeten aan je behaalde vaardigheden of diploma&apos;s, maar vooral
              aan het plezier dat je ervaart. Onze diplomalijn is ontworpen om duidelijke stappen en
              realistische doelen te bieden, waarbij ondersteuning altijd binnen handbereik is en
              elk succesmoment wordt gevierd.
            </p>
          </div>

          <div className={classNameBlock}>
            <H3>Technologie als ruggengraat.</H3>
            <p className={classNameParagraph}>
              Technologie is de ruggengraat die zorgt voor een vlekkeloze ervaring op en naast het
              water, zowel voor watersporters als voor instructeurs en vaarlocaties. Het NWD
              verzorgt het technisch fundament en stimuleert de ontwikkeling van eigen innovatieve
              toepassingen.
            </p>
          </div>

          <p className="text-justify">
            Het NWD erkent de rijke diversiteit binnen de watersportwereld, van verenigingen en
            scoutinggroepen tot professionele vaarscholen. Actief voorlichten van consumenten over
            alle beschikbare mogelijkheden, zowel online als offline, helpt iedereen hun perfecte
            match te vinden. Ons netwerk van ervaren en gepassioneerde professionals staat garant
            voor een toekomst waarin kwaliteit, veiligheid en plezier centraal staan.
          </p>

          <h4 className="pt-6 text-center text-base font-bold md:text-lg lg:text-xl">
            <Balancer>
              Wij zijn het Nationaal Watersportdiploma. Ontwikkel je vaardigheden op het water,
              veilig en vol plezier!
            </Balancer>
          </h4>
        </div>
      </div>
    </div>
  );
}

function CTA() {
  return (
    <div>
      <div className="px-6 py-24 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Benieuwd naar meer informatie?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-neutral-700">
            Schrijf je als vaarschooleigenaar in voor onze volgende digitale informatiebijeenkomst
            op vrijdag 1 maart 2024.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="https://forms.gle/rgU8H9qHuiEb4dm48"
              target="_blank"
              className="flex items-center rounded-full bg-brand-light-blue hover:bg-brand-dark-blue px-4 py-2 font-medium text-white"
            >
              Meld je locatie aan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Contact() {
  return (
    <div className="flex flex-col items-center justify-center bg-brand-light-blue/15 py-16">
      <h2 className="text-center text-3xl font-bold leading-tight text-brand-dark-blue">Contact</h2>
      <p className="mt-1.5 text-center text-lg leading-tight text-neutral-900">
        Heb je vragen of wil je meer informatie? Neem dan contact met ons op.
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="mx-auto max-w-7xl">
        <Hero />
        <Features />
        <Manifest />
        <CTA />
        {/* <Contact /> */}
      </div>
    </main>
  );
}
