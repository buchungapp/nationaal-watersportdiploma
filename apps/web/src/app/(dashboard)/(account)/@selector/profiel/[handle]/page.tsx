import { ChevronDownIcon, UsersIcon } from "@heroicons/react/16/solid";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { DropdownButton } from "~/app/(dashboard)/_components/dropdown";
import { NavbarItem, NavbarLabel } from "~/app/(dashboard)/_components/navbar";
import { getPersonByHandle, getUserOrThrow } from "~/lib/nwd";

export default async function PersonSelector(props: {
  params: Promise<{ handle: string }>;
}) {
  const { persons } = await getUserOrThrow();
  const params = await props.params;
  const person = await getPersonByHandle(params.handle);

  return (
    <DropdownButton
      as={NavbarItem}
      className="[&>*]:bg-white [&>*]:border [&>*]:border-slate-200"
    >
      <UsersIcon className="hidden md:block" />
      <NavbarLabel className="max-w-[80px] truncate">
        {[person.firstName, person.lastNamePrefix, person.lastName]
          .filter(Boolean)
          .join(" ")}
      </NavbarLabel>
      <Badge className="-my-1 invisible md:visible">{persons.length}</Badge>
      <ChevronDownIcon />
    </DropdownButton>
  );
}
