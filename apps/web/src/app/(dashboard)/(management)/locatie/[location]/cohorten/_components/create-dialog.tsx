import { listPersonsForLocation, listPrograms } from "~/lib/nwd";
import CreateDialogClient from "./create-dialog-client";

export default async function CreateDialog({
  locationId,
}: {
  locationId: string;
}) {
  const [persons, programs] = await Promise.all([
    listPersonsForLocation(locationId),
    listPrograms(),
  ]);

  return (
    <CreateDialogClient
      locationId={locationId}
      persons={persons}
      programs={programs}
    />
  );
}
