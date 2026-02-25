import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import { FeatureCard } from "./feature-card";

export default function About() {
  return (
    <section className="container mx-auto flex flex-col gap-12 px-4 lg:px-16">
      <div className="grid max-w-(--breakpoint-lg) gap-4 self-center text-center">
        <div className="flex items-center justify-center gap-x-3 font-bold uppercase text-branding-dark">
          <span className="whitespace-nowrap">De NWD kwaliteitsgarantie</span>
          <Double />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
          De zekerheden van een NWD-erkende locatie
        </h2>
        <p className="text-lg text-slate-600 text-pretty">
          Elke NWD-locatie wordt getoetst op de strengste eisen. Dat betekent
          dat je altijd kunt rekenen op dezelfde hoge standaard, waar je ook
          vaart.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
          }
          title="De hoogste veiligheidsmaatregelen"
          description="Moderne voorzieningen zoals helmen bij sportief zeilen en krachtige rescueboten zorgen voor veilig en verantwoord vaarplezier."
        />

        <FeatureCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
          }
          title="Sociaal veiligheidsbeleid"
          description="Een professioneel beleid met gedragscodes en vertrouwenspersonen dragen bij aan een prettige en veilige omgeving voor iedereen."
        />

        <FeatureCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
              />
            </svg>
          }
          title="Deskundige instructeurs"
          description="Regelmatige her- en bijscholing voor alle medewerkers op NWD-locaties garandeert de beste begeleiding op het water."
        />

        <FeatureCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819"
              />
            </svg>
          }
          title="Scherp toezicht op accommodaties"
          description="Strenge controles op o.a. brand- en voedselveiligheid zorgen voor een zorgeloos verblijf, ook buiten het water."
        />

        <FeatureCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path d="M22 12a10.06 10.06 1 0 0-20 0Z" />
              <path d="M12 12v8a2 2 0 0 0 4 0" />
              <path d="M12 2v1" />
            </svg>
          }
          title="Complete verzekeringsbescherming"
          description="Uitgebreide dekking inclusief alle wettelijk vereiste verzekeringen voor maximale zekerheid tijdens je verblijf."
        />

        <FeatureCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
              />
            </svg>
          }
          title="Flexibele en modulaire diplomalijn"
          description="Stel je eigen leertraject samen. Of je nu wilt leren zeilen, surfen of motorboot varen, je leert precies wat jij wilt op jouw tempo."
        />
      </div>

      <div className="flex justify-center">
        <BoxedButton
          href="/vaarlocaties/kwaliteitseisen"
          className="bg-branding-dark text-white"
        >
          Bekijk alle kwaliteitseisen
        </BoxedButton>
      </div>
    </section>
  );
}
