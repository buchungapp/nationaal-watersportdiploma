import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import FaqAccordion from "./faq-accordion";

const faqItems = [
  {
    question: "Waarom is het Nationaal Watersportdiploma de nieuwe standaard?",
    answer:
      "Het NWD is vanaf 2026 het enige watersportdiploma dat wordt erkend door het Watersportverbond. Het vervangt het CWO-diploma en stelt hogere eisen aan veiligheid, materiaalkwaliteit, instructeurskwalificaties en accommodaties. Daarmee biedt het NWD de meest complete garantie voor veilig en kwalitatief watersportonderwijs in Nederland.",
  },
  {
    question: "Is mijn oude CWO-diploma nog geldig?",
    answer:
      "Je CWO-diploma blijft altijd een bewijs van wat je hebt geleerd. Maar omdat het NWD de nieuwe officieel erkende standaard wordt, raden we aan om over te stappen. Dat kan eenvoudig en je ontvangt zelfs \u20AC50 cashback als je nu overstapt naar het NWD.",
  },
  {
    question: "Hoe vind ik een NWD-erkende vaarschool?",
    answer:
      "Op onze vaarlocatiepagina vind je een interactieve kaart met alle NWD-erkende locaties in Nederland. Elke locatie is gecontroleerd op de strengste kwaliteitseisen. Klik op een locatie om meer te weten te komen over het aanbod en neem direct contact op.",
  },
  {
    question: "Wat houdt de flexibele diplomalijn precies in?",
    answer:
      "De NWD-diplomalijn is modulair opgebouwd. Dat betekent dat je precies die vaardigheden leert die jij belangrijk vindt, op het type boot dat jij kiest. Elke behaalde competentie wordt direct geregistreerd in je persoonlijke profiel. Zo bouw je stap voor stap aan een diploma dat volledig past bij jouw ambitie en niveau.",
  },
];

export default function Faq() {
  return (
    <section className="container mx-auto grid gap-12 px-4 lg:px-16">
      <div className="max-w-(--breakpoint-lg) mx-auto text-center grid gap-4">
        <div className="flex items-center justify-center gap-x-3 font-bold uppercase text-branding-dark">
          Al je vragen beantwoord
          <Double />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
          Veelgestelde vragen
        </h2>
      </div>

      <div className="max-w-(--breakpoint-md) mx-auto w-full">
        <FaqAccordion items={faqItems} />
      </div>

      <div className="flex justify-center">
        <BoxedButton href="/help" className="bg-branding-dark text-white">
          Bezoek het helpcentrum
        </BoxedButton>
      </div>
    </section>
  );
}
