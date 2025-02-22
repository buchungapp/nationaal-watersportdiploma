import Balancer from "react-wrap-balancer";

import Logo from "~/app/_components/brand/logo";
import { BoxedButton } from "../../_components/style/buttons";
import AboutSection from "./about-section";

export default function About() {
  return (
    <section className="container mx-auto flex flex-col gap-12 px-4 lg:px-16">
      <div className="grid max-w-(--breakpoint-lg) gap-4 self-center text-center">
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          <Balancer>
            Dé nieuwe standaard in veiligheid, kwaliteit en plezier op het
            water.
          </Balancer>
        </h2>
        <p className="text-lg text-slate-600">
          <Balancer>
            Nu is het moment om de lat hoger te leggen als het aankomt op
            kwaliteitseisen en diplomalijnen binnen de Nederlandse watersport.
            Het resultaat is het Nationaal Watersportdiploma (NWD).
          </Balancer>
        </p>

        <div className="mt-6 mx-auto flex flex-col md:flex-row items-center gap-x-6 gap-y-4">
          <BoxedButton
            href="/vaarlocaties/kwaliteitseisen"
            className="text-white bg-branding-light"
          >
            Kwaliteitseisen voor locaties
          </BoxedButton>
          <BoxedButton
            href="/vereniging/manifest"
            className="text-branding-dark hover:bg-white/10"
          >
            Ons manifest
          </BoxedButton>
        </div>
      </div>
      <div className="grid items-center justify-center gap-12 lg:grid-cols-2 lg:gap-0">
        <div className="flex w-full justify-center">
          <Logo className="h-full max-h-52 lg:max-h-80 w-full max-w-52 lg:max-w-80 rounded-full text-white shadow-[0px_10px_40px_0px_#0000000D]" />
        </div>
        <div className="grid max-w-lg gap-16">
          <AboutSection
            label="Veiligheid"
            title="Veiligheid voorop."
            description="Een veilige omgeving voor iedereen, met aandacht voor fysieke en sociale veiligheid."
            color="dark"
          />
          <AboutSection
            label="Kwaliteit"
            title="Kwaliteit als basis."
            description="Moderne materialen, hooggekwalificeerde instructeurs, strenge kwaliteitsnormen."
            color="light"
          />
          <AboutSection
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
