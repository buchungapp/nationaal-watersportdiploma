import { listLocationsForPerson } from "~/lib/nwd";
import { Button } from "../../_components/button";
import { Link } from "../../_components/link";
import { Text } from "../../_components/text";

export default async function Page() {
  const locations = await listLocationsForPerson();

  return (
    <div className="p-4 max-w-prose mx-auto">
      <Text>
        He pionier, je hebt work-in-progress gevonden. Op dit moment werken we
        namelijk hard aan het implementeren van de nieuwe applicatie. Zodra het
        zover is, zullen we je hierover informeren.
      </Text>

      <div className="my-6">
        <h2>Wat nu?</h2>
        <ul>
          <li>
            <Button href="/" plain>
              Terug naar de homepage
            </Button>
          </li>
          <li>
            <Button href="https://www.nationaalwatersportdiploma.dev" plain>
              Volg de ontwikkelingen via GitHub
            </Button>
          </li>
        </ul>
      </div>

      {locations.length > 0 ? (
        <div className="my-6">
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
        </div>
      ) : null}
    </div>
  );
}
