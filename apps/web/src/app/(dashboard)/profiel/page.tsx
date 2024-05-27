import { logout } from "~/app/_actions/auth";
import { listLocationsForPerson } from "~/lib/nwd";
import { Button } from "../_components/button";
import { Link } from "../_components/link";

export default async function Page() {
  const locations = await listLocationsForPerson();

  return (
    <div className="p-4 prose max-w-prose mx-auto">
      <p>
        He pionier, je hebt work-in-progress gevonden. Op dit moment werken we
        namelijk hard aan het implementeren van de nieuwe applicatie. Zodra het
        zover is, zullen we je hierover informeren.
      </p>

      <h2>Wat nu?</h2>
      <ul>
        <li>
          <Button href="/">Terug naar de homepage</Button>
        </li>
        <li>
          <Button href="https://www.nationaalwatersportdiploma.dev">
            Volg de ontwikkelingen via GitHub
          </Button>
        </li>
        <li>
          <Button onClick={logout}>Volg de ontwikkelingen via GitHub</Button>
        </li>
      </ul>

      {locations.length > 0 ? (
        <>
          <h2>Beheer locatie</h2>
          <ul>
            {locations.map((location) => (
              <li key={location.id}>
                <Link href={`/${location.handle}/personen`}>
                  {location.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
