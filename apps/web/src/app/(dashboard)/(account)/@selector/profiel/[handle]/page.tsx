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
    <DropdownButton as={NavbarItem} className="max-lg:hidden">
      <Avatar src="/tailwind-logo.svg" />
      <NavbarLabel>Tailwind Labs</NavbarLabel>
      <ChevronDownIcon />
    </DropdownButton>
  );
}
