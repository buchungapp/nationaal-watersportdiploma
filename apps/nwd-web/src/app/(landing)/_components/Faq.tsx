import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import Double from "~/app/_assets/Double";

export default function Faq() {
  return (
    <section className="grid gap-20 px-4 lg:px-16">
      <div className="grid gap-10">
        <div className="grid gap-2">
          <div className={"flex gap-3 items-center text-branding-dark"}>
            <span className="uppercase whitespace-nowrap font-bold">
              Hoe zit het
            </span>
            <Double />
          </div>
          <h2 className="font-bold text-2xl">
            <Balancer>Veelgestelde vragen.</Balancer>
          </h2>
          <p>
            Het NWD is nieuw, dus het is niet gek dat dit wat vragen bij je
            oproept. Daarom zetten wij alvast een aantal van de meestgestelde
            vragen voor je op een rijtje.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2">
          <Link
            href="/faq"
            className="text-white bg-branding-dark group text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
          >
            Bekijk alle vragen{" "}
            <ArrowLongRightIcon
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              strokeWidth={2.5}
            />
          </Link>
          <Link
            href="/faq#instructeurs-en-vaarlocaties"
            className="group text-branding-dark text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
          >
            Voor instructeurs en vaarlocaties{" "}
            <ArrowLongRightIcon
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              strokeWidth={2.5}
            />
          </Link>
        </div>
      </div>
      <div
        className="columns-1 lg:columns-3 space-y-10"
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
            <h4 className="font-semibold text-branding-dark text-lg">
              {question}
            </h4>
            <p className="text-justify">{answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
