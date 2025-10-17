"use client";

import { useParams, useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import { toast } from "sonner";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import { addActorToLocationAction } from "~/app/_actions/person/add-actor-to-location-action";
import { removeActorFromLocationAction } from "~/app/_actions/person/remove-actor-from-location-action";
import type { LocationActorType } from "~/lib/nwd";

type Role = LocationActorType;

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

  const onToggle = (checked: boolean) => {
    startTransition(async () => {
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
    });
  };

  return <Checkbox checked={optimisticChecked} onChange={onToggle} />;
}
