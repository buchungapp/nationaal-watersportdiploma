import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import { DropdownButton } from "~/app/(dashboard)/_components/dropdown";
import { NavbarItem, NavbarLabel } from "~/app/(dashboard)/_components/navbar";
import { getPersonByHandle } from "~/lib/nwd";

export default async function PersonSelector({
  params,
}: {
  params: { handle: string };
}) {
  const person = await getPersonByHandle(params.handle);

  return (
    <DropdownButton as={NavbarItem}>
      <Avatar initials={person.firstName.slice(0, 2)} />
      <NavbarLabel>
        {[person.firstName, person.lastNamePrefix, person.lastName]
          .filter(Boolean)
          .join(" ")}
      </NavbarLabel>
      <ChevronDownIcon />
    </DropdownButton>
  );
}
