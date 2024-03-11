import Balancer from "react-wrap-balancer";
import Logo from "~/app/_components/brand/logo";
import AboutSection from "./about-section";

export default function About() {
  return (
    <section className="container mx-auto gap-12 flex flex-col px-4 lg:px-16">
      <div className="grid gap-4 text-center self-center max-w-screen-lg">
        <h2 className="font-bold text-3xl sm:text-4xl text-gray-900">
          <Balancer>Dé nieuwe standaard in veiligheid, kwaliteit en plezier op het water.</Balancer>
        </h2>
        <p className="text-lg text-gray-600">
          <Balancer>
            Nu is het moment is om de lat hoger te leggen als het aankomt op kwaliteitseisen en
            diplomalijnen binnen de Nederlandse watersport. Het resultaat is het Nationaal
            Watersportdiploma (NWD).
          </Balancer>
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-12 justify-center lg:gap-0 items-center">
        <div className="w-full justify-center flex">
          <Logo className="max-w-[24rem] max-h-[24rem] w-full h-full text-white rounded-full shadow-[0px_10px_40px_0px_#0000000D]" />
        </div>
        <div className="grid gap-16 max-w-lg">
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
