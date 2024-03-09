import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Gedragscode() {
  return (
    <article className="prose">
      <div className="prose-lg">
        <h3>Gedragscode</h3>
        <p>
          Deze gedragscode stelt de minimale eisen vast aan gedrag, interacties en
          verantwoordelijkheden binnen onze aangesloten locaties. Het dient als een leidraad om
          ervoor te zorgen dat alle cursisten, instructeurs en medewerkers kunnen genieten van een
          respectvolle en inclusieve watersportgemeenschap. Belangrijke onderwerpen zoals
          omgangsnormen, (seksueel) grensoverschrijdend gedrag, alcohol- en drugsbeleid, en het
          gebruik van materialen worden hierin geadresseerd.
        </p>
      </div>
      <p>
        We erkennen de unieke identiteit van elke NWD-locatie en geven hen de ruimte om deze
        gedragscode aan te vullen met eigen specifieke regels en richtlijnen. Dit zorgt ervoor dat
        elke locatie maatwerk kan leveren dat aansluit bij hun specifieke omstandigheden en
        gemeenschap, terwijl de kernwaarden van veiligheid, respect en gemeenschapszin behouden
        blijven.
      </p>

      <Link
        href="/gedragscode.pdf"
        target="_blank"
        className="flex gap-2 font-medium items-center text-white w-fit bg-branding-light rounded-full px-3.5 py-1.5 not-prose"
      >
        <ArrowDownTrayIcon className="w-5 h-5" strokeWidth={2} /> Download Model Gedragscode
      </Link>
    </article>
  );
}
