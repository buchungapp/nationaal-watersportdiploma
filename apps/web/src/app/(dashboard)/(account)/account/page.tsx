import { LayoutMobilePadding } from "../../_components/layout-card";
import { Text } from "../../_components/text";
import { Account } from "./_components/account";
import { Persons } from "./_components/persons";
import { Welcome } from "./_components/welcome";

export default function Page() {
  return (
    <div className="space-y-2 mx-auto max-w-3xl">
      <LayoutMobilePadding>
        <Welcome />
        <Text>Op deze pagina beheer je jouw NWD-account.</Text>
      </LayoutMobilePadding>

      <Account />

      <Persons />
    </div>
  );
}
