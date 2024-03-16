import Balancer from "react-wrap-balancer";

import Logo from "~/app/_components/brand/logo";
import AboutSection from "./about-section";

export default function About() {
  return (
    <section className="container mx-auto flex flex-col gap-12 px-4 lg:px-16">
      <div className="grid max-w-screen-lg gap-4 self-center text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          <Balancer>
            Dé nieuwe standaard in veiligheid, kwaliteit en plezier op het
            water.
          </Balancer>
        </h2>
        <p className="text-lg text-gray-600">
          <Balancer>
            Nu is het moment is om de lat hoger te leggen als het aankomt op
            kwaliteitseisen en diplomalijnen binnen de Nederlandse watersport.
            Het resultaat is het Nationaal Watersportdiploma (NWD).
          </Balancer>
        </p>
      </div>
      <div className="grid items-center justify-center gap-12 lg:grid-cols-2 lg:gap-0">
        <div className="flex w-full justify-center">
          <Logo className="h-full max-h-[24rem] w-full max-w-[24rem] rounded-full text-white shadow-[0px_10px_40px_0px_#0000000D]" />
        </div>
        <div className="grid max-w-lg gap-16">
          <AboutSection
            href="/veiligheid"
            label="Veiligheid"
            title="Veiligheid voorop."
            description="Een veilige omgeving voor iedereen, met aandacht voor fysieke en sociale veiligheid."
            color="dark"
          />
          <AboutSection
            href="/kwaliteit"
            label="Kwaliteit"
            title="Kwaliteit als basis."
            description="Moderne materialen, hooggekwalificeerde instructeurs, strenge kwaliteitsnormen."
            color="light"
          />
          <AboutSection
            href="/plezier"
            label="Plezier"
            title="Plezier staat centraal."
            description="Leren watersporten moet leuk zijn, met heldere stappen naar je volgende diploma en vele succesmomenten."
            color="orange"
          />
        </div>
      </div>
    </section>
  );
}
