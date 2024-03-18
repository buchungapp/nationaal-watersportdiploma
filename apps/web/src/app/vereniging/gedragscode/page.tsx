import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gedragscode",
};

export default function Page() {
  return (
    <article className="prose max-w-prose">
      <div className="prose-lg">
        <p>
          Deze gedragscode stelt de minimale eisen vast aan gedrag, interacties
          en verantwoordelijkheden binnen onze aangesloten locaties. Het dient
          als een leidraad om ervoor te zorgen dat alle cursisten, instructeurs
          en medewerkers kunnen genieten van een respectvolle en inclusieve
          watersportgemeenschap. Belangrijke onderwerpen zoals omgangsnormen,
          (seksueel) grensoverschrijdend gedrag, alcohol- en drugsbeleid, en het
          gebruik van materialen worden hierin geadresseerd.
        </p>
      </div>
      <p>
        We erkennen de unieke identiteit van elke NWD-locatie en geven hen de
        ruimte om deze gedragscode aan te vullen met eigen specifieke regels en
        richtlijnen. Dit zorgt ervoor dat elke locatie maatwerk kan leveren dat
        aansluit bij hun specifieke omstandigheden en gemeenschap, terwijl de
        kernwaarden van veiligheid, respect en gemeenschapszin behouden blijven.
      </p>

      <div className="not-prose flex w-full justify-center sm:justify-start">
        <Link
          href="/20240315-nwd-gedragscode-2401.pdf"
          target="_blank"
          className="flex w-fit text-sm items-center gap-2 transition-colors rounded-full bg-branding-light hover:bg-branding-dark px-3.5 py-1.5 text-white"
        >
          <ArrowDownTrayIcon className="h-4 w-4" strokeWidth={2} />
          Download Model Gedragscode
        </Link>
      </div>
    </article>
  );
}
