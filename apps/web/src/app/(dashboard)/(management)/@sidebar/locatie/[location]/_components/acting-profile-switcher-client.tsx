"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { setActingProfileForLocationAction } from "~/app/_actions/location/set-acting-profile-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import { Avatar } from "../../../../../_components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../../../../../_components/dropdown";
import { SidebarItem, SidebarLabel } from "../../../../../_components/sidebar";

type SwitchOption = {
  personId: string;
  fullName: string;
  initials: string;
  roleLabels: string[];
};

export function ActingProfileSwitcherDropdown({
  locationId,
  actingName,
  actingRoleLabels,
  actingInitials,
  options,
}: {
  locationId: string;
  actingName: string;
  actingRoleLabels: string[];
  actingInitials: string;
  options: SwitchOption[];
}) {
  const router = useRouter();

  const { execute, status } = useAction(setActingProfileForLocationAction, {
    onSuccess: () => {
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  const pending = status === "executing";

  return (
    <Dropdown>
      <DropdownButton
        as={SidebarItem}
        className="lg:mb-2.5"
        title={`Handelt als ${actingName}`}
        disabled={pending}
      >
        <Avatar className="size-6 shrink-0" initials={actingInitials} />
        <SidebarLabel>
          <span className="block text-xs/4 text-zinc-500 dark:text-zinc-400">
            Handelt als
          </span>
          <span className="block truncate">{actingName}</span>
          {actingRoleLabels.length > 0 ? (
            <span className="block truncate text-xs/4 text-zinc-500 dark:text-zinc-400">
              {actingRoleLabels.join(", ")}
            </span>
          ) : null}
        </SidebarLabel>
      </DropdownButton>

      <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
        {options.map((option) => (
          <DropdownItem
            key={option.personId}
            onClick={() => execute({ locationId, personId: option.personId })}
          >
            <Avatar
              slot="icon"
              initials={option.initials}
              className="bg-purple-500 text-white"
            />
            <DropdownLabel>
              {option.fullName}
              {option.roleLabels.length > 0 ? (
                <span className="text-zinc-500">
                  {" "}
                  · {option.roleLabels.join(", ")}
                </span>
              ) : null}
            </DropdownLabel>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
