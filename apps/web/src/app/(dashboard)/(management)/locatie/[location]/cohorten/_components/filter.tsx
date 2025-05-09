import { Suspense } from "react";
import { listRolesForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import { FilterSelectClient } from "./filter-client";

type FilterSelectProps = {
  params: Promise<{
    location: string;
  }>;
};

async function FilterSelectContent(props: FilterSelectProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const rolesInCurrentLocation = await listRolesForLocation(location.id);
  const isLocationAdmin = rolesInCurrentLocation.includes("location_admin");

  return isLocationAdmin ? <FilterSelectClient /> : null;
}

export function FilterSelect({ params }: FilterSelectProps) {
  return (
    <Suspense fallback={null}>
      <FilterSelectContent params={params} />
    </Suspense>
  );
}
