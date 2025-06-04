import { Text, TextLink } from "../../_components/text";
import { Account } from "./_components/account";
import { Persons } from "./_components/persons";
import { Welcome } from "./_components/welcome";

export default function Page() {
  return (
    <div className="space-y-2 mx-auto max-w-3xl">
      <div>
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
      </div>

      <Account />

      <Persons />
    </div>
  );
}
