import { Suspense, type PropsWithChildren } from "react";
import { getUserOrThrow } from "~/lib/nwd";
import { Avatar } from "../../_components/avatar";
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../../_components/dropdown";

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
          <DropdownItem key={person.id} href={`/profiel/${person.handle}`}>
            <Avatar
              slot="icon"
              initials={person.firstName.slice(0, 2)}
              className="bg-branding-orange text-white"
            />
            <DropdownLabel>
              {[person.firstName, person.lastNamePrefix, person.lastName]
                .filter(Boolean)
                .join(" ")}
            </DropdownLabel>
          </DropdownItem>
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
