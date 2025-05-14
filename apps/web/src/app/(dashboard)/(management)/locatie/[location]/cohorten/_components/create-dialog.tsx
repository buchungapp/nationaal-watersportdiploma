import { PlusIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { listRolesForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import CreateDialogClient from "./create-dialog-client";

type CreateDialogProps = {
  params: Promise<{
    location: string;
  }>;
};

async function CreateDialogContent(props: CreateDialogProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const personLocationRoles = await listRolesForLocation(location.id);

  if (!personLocationRoles.includes("location_admin")) {
    return null;
  }

  return <CreateDialogClient locationId={location.id} />;
}

function CreateDialogFallback() {
  return (
    <Button
      color="branding-orange"
      type="button"
      className="whitespace-nowrap"
      disabled
    >
      <PlusIcon />
      Cohort toevoegen
    </Button>
  );
}

export default async function CreateDialog(props: CreateDialogProps) {
  return (
    <Suspense fallback={<CreateDialogFallback />}>
      <CreateDialogContent params={props.params} />
    </Suspense>
  );
}
