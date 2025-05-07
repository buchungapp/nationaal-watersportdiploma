import { UserIcon } from "@heroicons/react/16/solid";
import {
  DropdownDescription,
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import { getUserOrThrow } from "~/lib/nwd";

export async function UserItem() {
  const user = await getUserOrThrow();

  return (
    <DropdownItem href="/account">
      <UserIcon />
      <DropdownLabel>Mijn account</DropdownLabel>
      <DropdownDescription>{user.email}</DropdownDescription>
    </DropdownItem>
  );
}

export async function UserItemFallback() {
  return (
    <DropdownItem>
      <UserIcon />
      <DropdownLabel>Mijn account</DropdownLabel>
      <DropdownDescription>laden...</DropdownDescription>
    </DropdownItem>
  );
}
