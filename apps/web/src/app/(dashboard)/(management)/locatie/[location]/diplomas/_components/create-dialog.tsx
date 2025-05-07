import { SWRConfig, unstable_serialize } from "swr";
import { listPersonsForLocationWithPagination, listPrograms } from "~/lib/nwd";
import CreateDialogClient from "./create-dialog-client";

export default async function CreateDialog({
  locationId,
}: {
  locationId: string;
}) {
  const [programs] = await Promise.all([listPrograms()]);

  return (
    <SWRConfig
      value={{
        fallback: {
          [unstable_serialize([
            "allStudents",
            locationId,
            "?actorType=student",
          ])]: listPersonsForLocationWithPagination(locationId, {
            filter: {
              actorType: "student",
            },
            limit: 25,
          }),
        },
      }}
    >
      <CreateDialogClient locationId={locationId} programs={programs} />
    </SWRConfig>
  );
}
