import { ChevronDownIcon, UsersIcon } from "@heroicons/react/16/solid";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { DropdownButton } from "~/app/(dashboard)/_components/dropdown";
import { NavbarItem, NavbarLabel } from "~/app/(dashboard)/_components/navbar";

export default function Loading() {
  return (
    <DropdownButton as={NavbarItem} className="[&>*]:bg-white">
      <UsersIcon />
      <NavbarLabel>
        <span className="inline-block bg-gray-200 -my-1 rounded w-30 h-6 align-middle animate-pulse" />
      </NavbarLabel>
      <Badge className="-my-1 w-5 h-6 align-middle animate-pulse" />
      <ChevronDownIcon />
    </DropdownButton>
  );
}
