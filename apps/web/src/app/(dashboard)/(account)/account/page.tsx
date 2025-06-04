import { Text } from "../../_components/text";
import { Account } from "./_components/account";
import { Persons } from "./_components/persons";
import { Welcome } from "./_components/welcome";

export default function Page() {
  return (
    <div className="space-y-2 mx-auto max-w-3xl">
      <div>
        <Welcome />
        <Text>Op deze pagina beheer je jouw NWD-account.</Text>
      </div>

      <Account />

      <Persons />
    </div>
  );
}
