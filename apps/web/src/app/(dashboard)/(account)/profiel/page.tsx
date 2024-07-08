import { listLocationsForPerson } from "~/lib/nwd";
import { Subheading } from "../../_components/heading";
import { Text, TextLink } from "../../_components/text";

export default async function Page() {
  const locations = await listLocationsForPerson().catch(() => null);

  if (!locations) {
    return (
      <Text>
        Je bent nog niet aan een vaarlocatie gekoppeld. Weet je zeker dat je het
        goede mailadres hebt gebruikt?
      </Text>
    );
  }

  return (
    <div className="p-4 max-w-prose mx-auto">
      {locations.length > 0 ? (
        <div className="my-6">
          <Subheading>Naar jouw vaarlocatie</Subheading>
          <ul className="space-y-2.5">
            {locations.map((location) => (
              <li key={location.id}>
                <TextLink href={`/locatie/${location.handle}/cohorten`}>
                  {location.name}
                </TextLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
