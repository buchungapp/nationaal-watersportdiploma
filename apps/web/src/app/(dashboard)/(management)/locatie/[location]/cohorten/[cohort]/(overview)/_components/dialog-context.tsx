import { notFound } from "next/navigation";
import { Suspense } from "react";
import { operatorIdentityWorkflowEnabled } from "~/lib/flags";
import {
  listCountries,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { DialogsClient } from "./dialog-context-client";

type DialogsProps = {
  params: Promise<{ location: string; cohort: string }>;
};

async function DialogsContent(props: DialogsProps) {
  const params = await props.params;
  const [location, countries, useNewBulkImport] = await Promise.all([
    retrieveLocationByHandle(params.location),
    listCountries(),
    operatorIdentityWorkflowEnabled(),
  ]);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  return (
    <DialogsClient
      locationId={location.id}
      cohortId={cohort.id}
      countries={countries.map((c) => ({ code: c.code, name: c.name }))}
      useNewBulkImport={useNewBulkImport}
    />
  );
}

export function Dialogs(props: DialogsProps) {
  return (
    <Suspense fallback={null}>
      <DialogsContent {...props} />
    </Suspense>
  );
}
