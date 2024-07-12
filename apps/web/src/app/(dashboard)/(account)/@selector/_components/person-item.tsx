"use client";

import { useParams } from "next/navigation";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";

export function PersonItem({ name, handle }: { name: string; handle: string }) {
  const params = useParams();

  const isSelected = params.handle === handle;

  return (
    <DropdownItem href={`/profiel/${handle}`} disabled={isSelected}>
      <Avatar
        slot="icon"
        initials={name.slice(0, 2)}
        className="bg-branding-orange text-white"
      />
      <DropdownLabel>{name}</DropdownLabel>
    </DropdownItem>
  );
}
