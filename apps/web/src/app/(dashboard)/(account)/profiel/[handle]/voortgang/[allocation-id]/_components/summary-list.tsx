import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import dayjs from "~/lib/dayjs";
import { retrieveStudentAllocationWithCurriculumForPerson } from "~/lib/nwd";

async function SummaryListContent(props: {
  params: Promise<{
    "allocation-id": string;
  }>;
}) {
  const params = await props.params;
  const allocation = await retrieveStudentAllocationWithCurriculumForPerson(
    params["allocation-id"],
  );

  if (!allocation) {
    return notFound();
  }

  return (
    <DescriptionList>
      <DescriptionTerm>Vaarlocatie</DescriptionTerm>
      <DescriptionDetails>{allocation.location.name}</DescriptionDetails>

      <DescriptionTerm>Bijgewerkt tot</DescriptionTerm>
      <DescriptionDetails>
        {dayjs(allocation.progressVisibleForStudentUpUntil)
          .tz()
          .format("DD-MM-YYYY HH:mm")}
      </DescriptionDetails>
    </DescriptionList>
  );
}

function SummaryListFallback() {
  return (
    <DescriptionList>
      <DescriptionTerm>Vaarlocatie</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded-md w-full h-4.25 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Bijgewerkt tot</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded-md w-full h-4.25 align-middle animate-pulse [animation-delay:0.3s]" />
      </DescriptionDetails>
    </DescriptionList>
  );
}

export function SummaryList(props: {
  params: Promise<{
    "allocation-id": string;
  }>;
}) {
  return (
    <Suspense fallback={<SummaryListFallback />}>
      <SummaryListContent params={props.params} />
    </Suspense>
  );
}
