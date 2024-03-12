import Article from "~/app/_components/style/article";
import { BoxedButton } from "~/app/_components/style/buttons";

export default function Faq() {
  return (
    <section className="container mx-auto grid gap-20 px-4 lg:px-16">
      <Article>
        <Article.Heading className="text-branding-dark">Hoe zit het</Article.Heading>
        <Article.Title as="h2">Veelgestelde vragen.</Article.Title>
        <Article.Paragraph>
          Het NWD is nieuw, dus het is niet gek dat dit wat vragen bij je oproept. Daarom zetten wij
          alvast een aantal van de meestgestelde vragen voor je op een rijtje.
        </Article.Paragraph>
        <Article.ButtonSection className="mt-8">
          <BoxedButton href="/faq" className="bg-branding-dark text-white">
            Bekijk alle vragen
          </BoxedButton>
          <BoxedButton
            href="/faq#instructeurs-en-vaarlocaties"
            className="hover:bg-branding-dark/10 text-branding-dark"
          >
            Voor instructeurs
          </BoxedButton>
          <BoxedButton
            href="/faq#instructeurs-en-vaarlocaties"
            className="hover:bg-branding-dark/10 text-branding-dark"
          >
            Voor vaarlocaties
          </BoxedButton>
        </Article.ButtonSection>
      </Article>
      <div
        className="columns-1 lg:columns-3 space-y-12 xl:space-y-12 gap-8"
        style={{
          columnFill: "balance",
        }}
      >
        {[
          {
            question: "Waarom nemen jullie nu afscheid van de CWO?",
            answer:
              "De stap naar NWD is gemaakt vanuit een gezamenlijke visie voor een progressieve toekomst in watersport, om kwaliteit verder te ontwikkelen.",
          },
          {
            question: "Worden de NWD diploma's wel erkend op andere locaties?",
            answer:
              "Het NWD diploma wordt erkend op alle locaties die zijn aangesloten bij de vereniging. Om compatibiliteit te verkrijgen met het CWO heeft het NWD een vertalingstabel opgesteld. Haal je een NWD diploma, dan staat dit voor maximale kwaliteit.",
          },
          {
            question: "Waarom zou ik voor een NWD zeilschool kiezen?",
            answer:
              "NWD zeilscholen garanderen veiligheid, kwaliteit en plezier, erkend met het NWD-keurmerk.",
          },
          {
            question: "Werkt het NWD met andere diploma-eisen?",
            answer:
              "Het NWD werkt met duidelijke en concrete diploma-eisen. Deze verschillen deels van die van de CWO. Er zit een duidelijke en logische opbouw in de NWD diploma-eisen.",
          },
          {
            question:
              "Werkt het NWD ook met een digitaal diploma? En zo ja, kan ik mijn huidige CWO diploma's daarin terugzien?",
            answer:
              "Het NWD werkt ook met een digitaal diploma dat je op je telefoon of op de computer kan openen en inzien. Behaalde CWO diploma's blijf je zien in jouw omgeving.",
          },
          {
            question: "Zijn mijn oude CWO diploma's nu niks meer waard?",
            answer:
              "Jouw oude CWO diploma's blijven geldig en inzichtelijk in de online applicatie.",
          },
          {
            question: "Wat voor invloed heeft deze verandering op de zeilweek?",
            answer:
              "Deze verandering heeft een positieve invloed op de zeilweek. Door de nieuwe manier van diplomeren wordt het elke keer opnieuw een succeservaring. De NWD diploma's zijn in goede haalbare stappen ingedeeld, met een modulaire opbouw. De inhoud van de zeilweek is en blijft door jouw eigen zeilschool gewaarborgd.",
          },
        ].map(({ question, answer }) => (
          <div key={question} className="break-inside-avoid-column grid gap-4">
            <h4 className="font-semibold text-branding-dark text-lg">{question}</h4>
            <p className="text-justify text-gray-700">{answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
