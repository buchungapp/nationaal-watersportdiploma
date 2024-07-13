import { listPersonsForLocationByRole, listPrograms } from "~/lib/nwd";
import CreateDialogClient from "./create-dialog-client";

export default async function CreateDialog({
  locationId,
}: {
  locationId: string;
}) {
  const [students, programs] = await Promise.all([
    listPersonsForLocationByRole(locationId, "student"),
    listPrograms(),
  ]);

  return (
    <CreateDialogClient
      locationId={locationId}
      persons={students}
      programs={programs}
    />
  );
}
