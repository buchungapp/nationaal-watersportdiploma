import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { DropdownButton } from "~/app/(dashboard)/_components/dropdown";
import { NavbarItem, NavbarLabel } from "~/app/(dashboard)/_components/navbar";

export default function PersonSelector() {
  return (
    <DropdownButton as={NavbarItem}>
      <NavbarLabel className="opacity-40">Selecteer persoon</NavbarLabel>
      <ChevronDownIcon />
    </DropdownButton>
  );
}
