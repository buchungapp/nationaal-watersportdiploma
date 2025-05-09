import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heading as HeadingComponent } from "~/app/(dashboard)/_components/heading";
import { retrieveCohortByHandle, retrieveLocationByHandle } from "~/lib/nwd";
type HeadingProps = {
  params: Promise<{ location: string; cohort: string }>;
};

async function HeadingContent(props: HeadingProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  return <HeadingComponent>{`Cohort ${cohort.label}`}</HeadingComponent>;
}

export function HeadingFallback() {
  return (
    <HeadingComponent>
      Cohort{" "}
      <span className="inline-block bg-gray-200 rounded w-24 h-6 align-middle animate-pulse" />
    </HeadingComponent>
  );
}

export function Heading(props: HeadingProps) {
  return (
    <Suspense fallback={<HeadingFallback />}>
      <HeadingContent {...props} />
    </Suspense>
  );
}
