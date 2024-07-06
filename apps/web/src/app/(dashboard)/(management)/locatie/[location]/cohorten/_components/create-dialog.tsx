import { listPrograms, listRolesForLocation } from "~/lib/nwd";
import CreateDialogClient from "./create-dialog-client";

export default async function CreateDialog({
  locationId,
}: {
  locationId: string;
}) {
  const [programs, personLocationRoles] = await Promise.all([
    listPrograms(),
    listRolesForLocation(locationId),
  ]);

  if (!personLocationRoles.includes("location_admin")) {
    return null;
  }

  return <CreateDialogClient locationId={locationId} programs={programs} />;
}
