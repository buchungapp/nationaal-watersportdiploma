import { StackedLayoutCard } from "../../_components/stacked-layout";
import { Text, TextLink } from "../../_components/text";
import { Locations } from "./_components/locations";
import { Persons } from "./_components/persons";
import { Welcome } from "./_components/welcome";

export default function Page() {
  return (
    <div className="space-y-9 mx-auto max-w-3xl">
      <StackedLayoutCard>
        <Welcome />
        <Text>
          Welkom in jouw NWD-omgeving. Op deze pagina vind je de cursisten die
          aan jouw account zijn gekoppeld. Zie je hier niet de cursisten die je
          verwacht? Neem dan contact op met de{" "}
          <TextLink href="/vaarlocaties" target="_blank">
            vaarlocatie
          </TextLink>{" "}
          waar de cursus is gevolgd.
        </Text>
      </StackedLayoutCard>
      <Persons />
      <Locations />
    </div>
  );
}
