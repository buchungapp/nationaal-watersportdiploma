import Double from "~/app/_components/brand/double-line";
import FaqGroup from "../../_components/faq/faq-group";

const faqs = [
  {
    question: "Wat is de cashback-actie?",
    answer:
      "De cashback-actie is een speciale aanbieding waarbij je €50 terugkrijgt op je meerdaagse zeilcursus of zeilkamp. De actie loopt van 9 april t/m 1 september 2025.",
    categories: ["cashback"],
  },
  {
    question: "Wat is de aanleiding voor de cashback-actie?",
    answer:
      "Het Watersportverbond heeft recent aangekondigd dat de NWD-diplomalijn op korte termijn de CWO standaard zal vervangen. Om dat te vieren, en iedereen kennis te laten maken met het NWD, hebben we deze cashback-actie gelanceerd.",
    categories: ["cashback"],
  },
  {
    question: "Hoe werkt de cashback-actie?",
    answer:
      "1. Behaal een CWO-diploma of vorderingenstaat in 2024\n" +
      "2. Boek een meerdaagse cursus of zeilkamp bij een NWD-erkende vaarlocatie\n" +
      "3. Vul het aanmeldformulier in en upload je diploma/vorderingenstaat\n" +
      "4. Na afloop van je cursus krijg je €50 terug op je rekening",
    categories: ["cashback"],
  },
  {
    question: "Wie kan meedoen aan de cashback-actie?",
    answer:
      "Iedereen die in 2024 een CWO-diploma of vorderingenstaat heeft behaald, kan meedoen aan de actie. Je moet wel een meerdaagse cursus of zeilkamp boeken bij een NWD-erkende vaarlocatie.",
    categories: ["cashback"],
  },
  {
    question: "Wanneer krijg ik mijn cashback?",
    answer:
      "De cashback van €50 wordt na afloop van je cursus uitbetaald, uiterlijk op 31 oktober 2025. Het bedrag wordt overgemaakt naar het door jou opgegeven IBAN-rekeningnummer.",
    categories: ["cashback"],
  },
  {
    question: "Wat gebeurt er met mijn cashback als ik de cursus annuleer?",
    answer:
      "Bij annulering van je cursus of zeilkamp vervalt automatisch het recht op cashback. Dit geldt ook bij verplaatsing van de cursus naar een datum na 1 september 2025. Alleen volledig afgeronde cursussen komen in aanmerking.",
    categories: ["cashback"],
  },
  {
    question: "Welke cursussen komen in aanmerking?",
    answer:
      "Alle meerdaagse zeilcursussen en zeilkampen (minimaal 2 dagen) bij NWD-erkende vaarlocaties komen in aanmerking. Eendaagse cursussen, losse lessen en privélessen zijn uitgesloten. Een actueel overzicht van erkende locaties vind je op nwd.nl/vaarlocaties.",
    categories: ["cashback"],
  },
  {
    question: "Kan ik de cashback combineren met andere kortingen?",
    answer:
      "Nee, de cashback-actie kan niet worden gecombineerd met andere kortingen of acties van de vaarlocatie of het NWD. Kies de aanbieding die voor jou het voordeligst is.",
    categories: ["cashback"],
  },
  {
    question: "Wat als er iets niet klopt met mijn aanvraag?",
    answer:
      "Als er gegevens ontbreken of onduidelijk zijn, ontvang je hierover een e-mail. Je krijgt dan één keer de gelegenheid om binnen 14 dagen de aanvraag te corrigeren. Zorg dus dat je e-mailadres correct is ingevuld.",
    categories: ["cashback"],
  },
  {
    question: "Wat gebeurt er met mijn persoonlijke gegevens?",
    answer:
      "Je gegevens worden alleen gebruikt voor de verwerking van de cashback-actie en worden gedeeld met de vaarlocatie voor verificatie van je boeking. Na afloop van de actie worden je gegevens verwijderd, met uitzondering van gegevens die we wettelijk moeten bewaren.",
    categories: ["cashback"],
  },
  {
    question: "Kan ik voor meerdere kinderen een cashback aanvragen?",
    answer:
      "Als ouder kun je voor meerdere kinderen een cashback aanvragen, maar let op:\n\n" +
      "<ul>" +
      "<li>Elk kind (deelnemer) moet individueel aan alle voorwaarden voldoen</li>" +
      "<li>Elk kind moet beschikken over een eigen CWO-diploma of vorderingenstaat uit 2024</li>" +
      "<li>Per kind kan er maar één keer worden deelgenomen aan de actie</li>" +
      "<li>Voor elk kind moet een apart aanmeldformulier worden ingevuld met de eigen diplomagegevens</li>" +
      "</ul>",
    categories: ["cashback"],
  },
  {
    question: "Wanneer is de cashback-actie geldig?",
    answer:
      "De actie loopt van 9 april t/m 1 september 2025. Je komt in aanmerking als je aan twee voorwaarden voldoet:\n1. Je hebt in 2024 een CWO-diploma of vorderingenstaat behaald\n2. Je boekt een meerdaagse zeilcursus of zeilkamp bij een NWD-erkende vaarlocatie",
    categories: ["cashback"],
  },
  {
    question: "Hoe vraag ik de cashback aan?",
    answer:
      "Het aanvragen gaat in drie stappen:\n1. Vul het online aanmeldformulier in\n2. Upload een duidelijke scan of foto van je CWO-diploma/vorderingenstaat uit 2024\n3. Voeg je boekingsnummer van de vaarlocatie toe\nZorg dat de uitgiftedatum op je diploma goed leesbaar is.",
    categories: ["cashback"],
  },
  {
    question: "Hoe lang heb ik om de cashback aan te vragen?",
    answer:
      "Je kunt je aanvraag indienen tot en met 1 september 2025, 23:59 uur. Let op: zowel je aanvraag als je cursus moeten vóór deze datum zijn afgerond. Na 1 september 2025 is deelname niet meer mogelijk.",
    categories: ["cashback"],
  },
  {
    question: "Mijn vraag staat er niet bij, wat nu?",
    answer:
      "Neem contact op met het NWD via info@nationaalwatersportdiploma.nl of bekijk de volledige actievoorwaarden. We reageren binnen 5 werkdagen op je vraag.",
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
