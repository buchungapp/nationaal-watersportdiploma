import { UserIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import {
  DropdownDescription,
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import { getUserOrThrow } from "~/lib/nwd";

function UserItemFallback() {
  return (
    <DropdownItem href="/account">
      <UserIcon />
      <DropdownLabel>Mijn account</DropdownLabel>
      <DropdownDescription>laden...</DropdownDescription>
    </DropdownItem>
  );
}

async function UserItemContent() {
  const user = await getUserOrThrow();

  return (
    <DropdownItem href="/account">
      <UserIcon />
      <DropdownLabel>Mijn account</DropdownLabel>
      <DropdownDescription>{user.email}</DropdownDescription>
    </DropdownItem>
  );
}

export function UserItem() {
  return (
    <Suspense fallback={<UserItemFallback />}>
      <UserItemContent />
    </Suspense>
  );
}
