"use client";

import { useOptimistic } from "react";
import { toast } from "sonner";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import {
  addActorToLocation,
  removeActorFromLocation,
} from "../../_actions/roles";

type Role = "student" | "instructor" | "location_admin";

export function RoleToggleCheckbox({
  type,
  roles,
  locationId,
  personId,
}: {
  type: Role;
  roles: Role[];
  locationId: string;
  personId: string;
}) {
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(
    !!roles.includes(type),
    (_current, checked: boolean) => {
      return checked;
    },
  );

  const onToggle = async (checked: boolean) => {
    setOptimisticChecked(checked);

    if (checked) {
      await addActorToLocation({
        locationId,
        personId,
        type,
      });
    } else {
      await removeActorFromLocation({
        locationId,
        personId,
        type,
      });
    }

    toast.success("Rol bijgewerkt");

    if (roles.length <= 1 && !checked) {
      // TODO: We disabled the last role, this person will be removed from the location,
      // and now we get a 404. Try to navigate back to the list of people.
    }
  };

  return <Checkbox checked={optimisticChecked} onChange={onToggle} />;
}
