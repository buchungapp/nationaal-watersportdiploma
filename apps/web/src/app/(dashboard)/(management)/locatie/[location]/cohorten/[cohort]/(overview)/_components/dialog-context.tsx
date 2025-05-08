import { notFound } from "next/navigation";
import { Suspense } from "react";
import { retrieveCohortByHandle, retrieveLocationByHandle } from "~/lib/nwd";
import { DialogsClient } from "./dialog-context-client";

type DialogsProps = {
  params: Promise<{ location: string; cohort: string }>;
};

async function DialogsContent(props: DialogsProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  return <DialogsClient locationId={location.id} cohortId={cohort.id} />;
}

export function Dialogs(props: DialogsProps) {
  return (
    <Suspense fallback={null}>
      <DialogsContent {...props} />
    </Suspense>
  );
}
