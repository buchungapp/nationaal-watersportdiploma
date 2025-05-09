import { Suspense } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import {
  listPersonsForLocationWithPagination,
  listPrograms,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import CreateDialogClient from "./create-dialog-client";

type CreateDialogProps = {
  params: Promise<{ location: string }>;
};

async function CreateDialogContent({ params }: CreateDialogProps) {
  const [programs, location] = await Promise.all([
    listPrograms(),
    params.then(({ location }) => retrieveLocationByHandle(location)),
  ]);

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
