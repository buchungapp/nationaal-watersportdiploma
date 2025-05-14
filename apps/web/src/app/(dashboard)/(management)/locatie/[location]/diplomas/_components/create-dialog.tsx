import { Suspense } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import {
  listPersonsForLocationWithPagination,
  listProgramsForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import CreateDialogClient from "./create-dialog-client";

type CreateDialogProps = {
  params: Promise<{ location: string }>;
};

async function CreateDialogContent(props: CreateDialogProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const programs = await listProgramsForLocation(location.id);

  return (
    <SWRConfig
      value={{
        fallback: {
          [unstable_serialize([
            "allStudents",
            location.id,
            "?actorType=student",
          ])]: listPersonsForLocationWithPagination(location.id, {
            filter: {
              actorType: "student",
            },
            limit: 25,
          }),
        },
      }}
    >
      <CreateDialogClient locationId={location.id} programs={programs} />
    </SWRConfig>
  );
}

function CreateDialogFallback() {
  return <div className="bg-gray-200 rounded-lg w-43.75 h-9 animate-pulse" />;
}

export default function CreateDialog(props: CreateDialogProps) {
  return (
    <Suspense fallback={<CreateDialogFallback />}>
      <CreateDialogContent {...props} />
    </Suspense>
  );
}
