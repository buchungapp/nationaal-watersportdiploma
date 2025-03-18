import Double from "~/app/_components/brand/double-line";
import FaqGroup from "../../_components/faq/faq-group";

const faqs = [
  {
    question: "Wanneer is de cashback actie geldig?",
    answer: "De cashback actie loopt van X t/m X.",
    categories: ["cashback"],
  },
  {
    question: "Welke vereisten zijn er voor de cashback?",
    answer:
      "Je moet in het bezit zijn van een geldig X en een nieuwe NWD-cursus boeken met een minimale waarde van X.",
    categories: ["cashback"],
  },
  {
    question: "Hoe lang heb ik om de cashback aan te vragen?",
    answer:
      "Je hebt 30 dagen na het boeken van de cursus om de cashback aan te vragen.",
    categories: ["cashback"],
  },
  {
    question: "Kan ik meerdere cashbacks aanvragen?",
    answer:
      "Per persoon kan maximaal één cashback per cursus worden aangevraagd.",
    categories: ["cashback"],
  },
  {
    question: "Wanneer wordt de cashback uitbetaald?",
    answer:
      "De cashback wordt uitbetaald na verificatie van de boeking en het X.",
    categories: ["cashback"],
  },
  {
    question: "Wat gebeurt er met mijn cashback als ik de cursus annuleer?",
    answer: "Bij annulering van de cursus vervalt het recht op de cashback.",
    categories: ["cashback"],
  },
  {
    question: "Kan de actie worden gewijzigd of beëindigd?",
    answer:
      "Ja, Nationaal Watersportdiploma behoudt zich het recht voor om de actie op elk moment te wijzigen of te beëindigen.",
    categories: ["cashback"],
  },
];

export default function CashbackFaq() {
  return (
    <section className="flex justify-center px-4 lg:px-16 container">
      <div className="flex flex-col gap-8 w-full max-w-5xl">
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-3 w-full font-bold text-branding-dark uppercase whitespace-nowrap">
            Hoe zit het
            <Double />
          </div>
          <h3 className="mt-1.5 font-bold text-slate-900 text-2xl">
            Veelgestelde vragen
          </h3>
        </div>
        <FaqGroup faqs={faqs} />
      </div>
    </section>
  );
}
