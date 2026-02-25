import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";

const steps = [
  {
    number: "1",
    title: "Vind een school op de kaart",
    description:
      "Kies een NWD-locatie bij jou in de buurt. Elke stip op de kaart staat voor gegarandeerde veiligheid en gecontroleerde kwaliteit.",
  },
  {
    number: "2",
    title: "Kies wat je wilt leren",
    description:
      "Bespreek jouw doelen met gekwalificeerde instructeurs. Je traint heel gericht voor de specifieke boot en vaardigheden die jij belangrijk vindt.",
  },
  {
    number: "3",
    title: "Behaal je officiële diploma",
    description:
      "Elke succesvolle oefening wordt direct geregistreerd. Je sluit je cursus af met het enige diploma dat wordt erkend door het Watersportverbond.",
  },
];

export default function HowItWorks() {
  return (
    <section className="container mx-auto px-4 lg:px-16">
      <div className="grid gap-12">
        <div className="max-w-(--breakpoint-lg) mx-auto text-center grid gap-4">
          <div className="flex items-center justify-center gap-x-3 font-bold uppercase text-branding-dark">
            Flexibele diplomalijn
            <Double />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
            Drie stappen naar jouw erkende watersportdiploma
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="grid gap-4">
              <span className="text-5xl font-extrabold text-branding-light/20">
                {step.number}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <BoxedButton
            href="/vaarlocaties"
            className="bg-branding-light text-white"
          >
            Vind een veilige locatie
          </BoxedButton>
        </div>
      </div>
    </section>
  );
}
