import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import { DropdownButton } from "~/app/(dashboard)/_components/dropdown";
import { NavbarItem, NavbarLabel } from "~/app/(dashboard)/_components/navbar";

export default function Loading() {
  return (
    <DropdownButton as={NavbarItem}>
      <Avatar initials="..." />
      <NavbarLabel>laden...</NavbarLabel>
      <ChevronDownIcon />
    </DropdownButton>
  );
}
