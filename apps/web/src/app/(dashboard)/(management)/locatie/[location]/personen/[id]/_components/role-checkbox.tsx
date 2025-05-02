"use client";

import { useParams, useRouter } from "next/navigation";
import { useOptimistic } from "react";
import { toast } from "sonner";
import { addActorToLocationAction } from "~/actions/person/add-actor-to-location-action";
import { removeActorFromLocationAction } from "~/actions/person/remove-actor-from-location-action";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";

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
  const router = useRouter();
  const params = useParams();

  const [optimisticChecked, setOptimisticChecked] = useOptimistic(
    !!roles.includes(type),
    (_current, checked: boolean) => {
      return checked;
    },
  );

  const onToggle = async (checked: boolean) => {
    setOptimisticChecked(checked);

    if (checked) {
      await addActorToLocationAction(locationId, { personId, type });
    } else {
      await removeActorFromLocationAction(locationId, { personId, type });
    }

    toast.success("Rol bijgewerkt");

    if (roles.length <= 1 && !checked) {
      // We disabled the last role, this person will be removed from the location,
      // redirect to the overview page
      router.push(`/locatie/${params.location as string}/personen`);
    }
  };

  return <Checkbox checked={optimisticChecked} onChange={onToggle} />;
}
