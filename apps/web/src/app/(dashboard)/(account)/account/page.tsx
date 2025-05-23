import { Text, TextLink } from "../../_components/text";
import { Locations } from "./_components/locations";
import { Persons } from "./_components/persons";
import { Welcome } from "./_components/welcome";

export default function Page() {
  return (
    <div className="mx-auto p-4 max-w-3xl">
      <Welcome />
      <Text>
        Welkom in jouw NWD-omgeving. Op deze pagina vind je de cursisten die aan
        jouw account zijn gekoppeld. Zie je hier niet de cursisten die je
        verwacht? Neem dan contact op met de{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          vaarlocatie
        </TextLink>{" "}
        waar de cursus is gevolgd.
      </Text>
      <Persons />
      <Locations />
    </div>
  );
}
