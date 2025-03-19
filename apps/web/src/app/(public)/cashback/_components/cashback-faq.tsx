import Double from "~/app/_components/brand/double-line";
import FaqGroup from "../../_components/faq/faq-group";

const faqs = [
  {
    question: "Wanneer is de cashback-actie geldig?",
    answer:
      "De actie loopt van 22 maart t/m 1 september 2025. Je komt in aanmerking als je in 2024 een CWO-diploma of vorderingenstaat hebt behaald én een meerdaagse cursus of zeilkamp boekt bij een erkende NWD-locatie.",
    categories: ["cashback"],
  },
  {
    question: "Welke vereisten zijn er voor de cashback?",
    answer:
      "Om in aanmerking te komen voor de cashback:\nHeb je in 2024 een CWO-diploma of vorderingenstaat behaald.\nUpload je een duidelijke foto of pdf met zichtbare uitgiftedatum.\nBoek je een meerdaagse cursus of zeilkamp bij een NWD-locatie.\nVermeld je het boekingsnummer van je cursus bij aanmelding.\n Let op: eendaagse cursussen zijn uitgesloten van deze actie.",
    categories: ["cashback"],
  },
  {
    question: "Hoe lang heb ik om de cashback aan te vragen?",
    answer:
      "Je kunt je aanvraag indienen tot en met 1 september 2025. Na die datum is deelname niet meer mogelijk.",
    categories: ["cashback"],
  },
  {
    question: "Kan ik meerdere cashbacks aanvragen?",
    answer:
      "De cashback is persoonlijk per cursist. Per cursist kan je slechts één keer deelnemen aan deze actie, ongeacht het aantal cursussen of boekingen. Als ouder kun je voor meerdere individuele cursisten een cashback aanvragen. Vul voor elke cursist afzonderlijk het formulier in.",
    categories: ["cashback"],
  },
  {
    question: "Wanneer wordt de cashback uitbetaald?",
    answer:
      "De cashback van €50 per persoon wordt uitgekeerd door het NWD in de maand september 2025, uiterlijk op 31 oktober 2025.",
    categories: ["cashback"],
  },
  {
    question: "Wat gebeurt er met mijn cashback als ik de cursus annuleer?",
    answer:
      "Bij annulering van je cursus of zeilkamp vervalt het recht op cashback. Alleen deelnemers met een bevestigde en betaalde boeking komen in aanmerking.",
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
