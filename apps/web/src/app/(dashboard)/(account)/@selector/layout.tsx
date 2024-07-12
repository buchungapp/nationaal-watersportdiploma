import { Suspense, type PropsWithChildren } from "react";
import { getUserOrThrow } from "~/lib/nwd";
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../../_components/dropdown";
import { PersonItem } from "./_components/person-item";

async function PersonsDropdownMenu() {
  const { persons } = await getUserOrThrow();

  if (persons.length === 0) {
    return (
      <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
        <DropdownItem disabled>
          <DropdownLabel>Geen personen beschikbaar.</DropdownLabel>
        </DropdownItem>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
      {persons.map((person) => {
        return (
          <PersonItem
            key={person.id}
            handle={person.handle}
            name={[person.firstName, person.lastNamePrefix, person.lastName]
              .filter(Boolean)
              .join(" ")}
          />
        );
      })}
    </DropdownMenu>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <Dropdown>
      {children}
      <Suspense fallback={null}>
        <PersonsDropdownMenu />
      </Suspense>
    </Dropdown>
  );
}
