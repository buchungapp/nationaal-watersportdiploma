import { clsx } from "clsx";
import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { H3 } from "~/app/_components/typography";
import Wave from "~/app/_components/wave";
import nwdIcon from "./_assets/nwd-icon-fine.svg";
import nwdFlag from "./_assets/nwd_flag.svg";
import headerImage from "./_assets/nwd_hero_cover-2.jpg";

function Hero() {
  return (
    <div className="relative flex flex-col justify-end w-full overflow-hidden">
      <div className="absolute top-0 h-48 sm:h-60 md:h-72 lg:h-96 overflow-hidden inset-x-0">
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <svg
              className="text-white absolute -bottom-[45px] sm:-bottom-[60px] md:-bottom-[75px] lg:-bottom-[110px] xl:-bottom-[140px] inset-x-0"
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
              className="text-brand-light-blue/15 bottom-[10px] sm:bottom-0 md:-bottom-[20px] translate-y-20 absolute lg:-bottom-[55px] xl:-bottom-[90px] inset-x-0"
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
          className="object-cover h-full object-bottom"
        />
      </div>

      <div className="relative pt-20 sm:pt-32 md:pt-40 lg:pt-64 flex gap-y-4 flex-col md:flex-row justify-between items-center md:items-end px-6 lg:px-24">
        <div>
          <h1 className="text-xl text-brand-orange leading-tight text-center md:text-left font-bold uppercase">
            <span className="font-normal">Nationaal</span> Watersportdiploma
          </h1>
          <h2 className="font-bold mt-4 sm:mt-2.5 text-2xl text-center md:text-left sm:text-3xl md:text-4xl lg:text-5xl max-w-prose text-neutral-900 leading-tight">
            <Balancer>
              De nieuwe standaard in veiligheid, kwaliteit en plezier.
            </Balancer>
          </h2>
          <Wave className="text-brand-light-blue h-3.5 lg:h-6 mt-2.5 mx-auto md:ml-0" />
        </div>
        <Image
          src={nwdIcon}
          priority
          alt=""
          className="rounded-full -order-1 md:order-none shadow-xl w-52 md:w-60 aspect-square"
        />
      </div>

      <div className="flex justify-center mt-12 sm:mt-16">
        <Link
          href="#manifest"
          className="rounded-full flex items-center bg-brand-dark-blue text-white py-2 px-4 font-medium"
        >
          Lees ons manifest
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 ml-2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
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
        "Een veilige omgeving voor iedereen, met zowel aandacht voor fysieke en sociale veiligheid.",
      color: "bg-brand-dark-blue",
    },
    {
      name: "Kwaliteit als basis.",
      description:
        "Moderne materialen, hooggekwalificeerde instructeurs, strenge kwaliteitseisen en verbeteren door samenwerken.",
      color: "bg-brand-light-blue",
    },
    {
      name: "Plezier staat centraal.",
      description:
        "Leren watersporten moet leuk zijn, met heldere stappen naar je volgende diploma en vele succesmomenten.",
      color: "bg-brand-orange",
    },
  ];

  return (
    <dl className="mb-12 mt-16 sm:mt-28 grid gap-x-8 gap-y-8 sm:gap-y-12 lg:grid-cols-3 px-6 lg:px-24">
      {features.map((feature) => (
        <div
          key={feature.name}
          className="flex flex-col bg-white overflow-hidden border-0 shadow-lg rounded-2xl p-4"
        >
          {/* <div className="absolute -inset-1 bg-white rounded-sm" /> */}

          <dt className="text-base font-semibold leading-7 text-gray-900">
            <div
              className={clsx("h-6 w-6 mb-4 rounded-full", feature.color)}
              aria-hidden="true"
            />
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
      className="relative w-fit mt-16 bg-white rounded-sm mx-2.5 shadow lg:px-28 py-8 md:py-14 lg:py-20 sm:mx-auto"
    >
      <div className="absolute left-6 md:left-8 lg:left-12 xl:left-16 -top-[2px] w-20 md:w-24 lg:w-32 h-auto">
        <Image src={nwdFlag} alt="" className="object-contain" />
      </div>

      <div className="max-w-prose mx-auto px-6 md:px-8">
        <div className="pl-24 md:pl-32 lg:pl-28 text-left space-y-1.5">
          <h2 className="uppercase text-lg leading-tight sm:text-2xl md:text-3xl text-brand-dark-blue">
            <span>Nationaal</span>{" "}
            <span className="font-bold">Watersportdiploma</span>
          </h2>
          {/* <p>&#8212;</p> */}
          <p className="text-neutral-900 text-lg sm:text-xl md:text-2xl">
            Merkmanifest
          </p>
        </div>

        <div className="pt-16 sm:pt-24 md:pt-16 lg:pt-36">
          {/* Dropcap first letter */}
          <p className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-1.5 text-justify">
            De afgelopen jaren hebben de leidende zeilscholen van Nederland,
            verenigd door een gedeelde visie op vooruitgang, elkaar steeds vaker
            opgezocht. Samen zijn we overtuigd dat het nu tijd is om de lat
            hoger te leggen en actief te blijven doorontwikkelen om de toekomst
            van de watersport te vormen.
          </p>
          <p className={clsx(classNameParagraph, "mt-4")}>
            Het resultaat is het Nationaal Watersportdiploma (NWD). Met een
            scherpe focus op veiligheid, kwaliteit en plezier voor elke
            watersporter, overstijgt het NWD de traditionele functie van een
            keurmerk of diplomalijn.
          </p>
        </div>

        <div className="space-y-10">
          <div className={classNameBlock}>
            <H3>Veiligheid voorop.</H3>
            <p className={classNameParagraph}>
              Veiligheid is allesomvattend binnen het NWD: van de
              standaarduitrusting, tot een breed spectrum aan persoonlijke en
              sociale veiligheid. Elke aangesloten locatie voldoet niet alleen
              aan essentiële veiligheidseisen, maar schept ook een omgeving
              waarin iedereen zich welkom en veilig voelt. De inzet van een
              vertrouwenspersoon en een gedragscode, die jaarlijks door alle
              betrokkenen wordt ondertekend, versterkt onze toewijding aan een
              veilige, respectvolle watersportgemeenschap.
            </p>
          </div>

          <div className={classNameBlock}>
            <H3>Kwaliteit als basis.</H3>
            <p className={classNameParagraph}>
              Kwaliteit toont zich in verschillende facetten: van het gebruik
              van goed onderhouden en moderne materialen, tot de aanwezigheid
              van hooggekwalificeerde instructeurs die regelmatig bijscholing
              ontvangen. We bevorderen een cultuur van constante verbetering,
              waarbij locaties materiaal uitwisselen, gezamenlijke
              trainingsdagen organiseren, en elkaar uitdagen om de beste in de
              branche te zijn.
            </p>
          </div>

          <div className={classNameBlock}>
            <H3>Plezier staat centraal.</H3>
            <p className={classNameParagraph}>
              Plezier staat centraal in alles wat we doen. We geloven dat succes
              in de watersport niet alleen wordt gemeten aan je behaalde
              vaardigheden of diploma&apos;s, maar vooral aan het plezier dat je
              ervaart. Onze diplomalijn is ontworpen om duidelijke stappen en
              realistische doelen te bieden, waarbij ondersteuning altijd binnen
              handbereik is en elk succesmoment wordt gevierd.
            </p>
          </div>

          <div className={classNameBlock}>
            <H3>Technologie als ruggengraat.</H3>
            <p className={classNameParagraph}>
              Technologie is de ruggengraat die zorgt voor een vlekkeloze
              ervaring op en naast het water, zowel voor watersporters als voor
              instructeurs en vaarlocaties. Het NWD verzorgt het technisch
              fundament en stimuleert de ontwikkeling van eigen innovatieve
              toepassingen.
            </p>
          </div>

          <p className="text-justify">
            Het NWD erkent de rijke diversiteit binnen de watersportwereld, van
            verenigingen en scoutinggroepen tot professionele vaarscholen.
            Actief voorlichten van consumenten over alle beschikbare
            mogelijkheden, zowel online als offline, helpt iedereen hun perfecte
            match te vinden. Ons netwerk van ervaren en gepassioneerde
            professionals staat garant voor een toekomst waarin kwaliteit,
            veiligheid en plezier centraal staan.
          </p>

          <h4 className="text-xl pt-6 font-bold text-center">
            <Balancer>
              Wij zijn het Nationaal Watersportdiploma. Voor elke watersporter,
              veilig en vol plezier!
            </Balancer>
          </h4>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-brand-light-blue/15">
      <div className="max-w-7xl mx-auto pb-12">
        <Hero />
        <Features />
        <Manifest />
      </div>
    </main>
  );
}
