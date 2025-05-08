import { Suspense } from "react";
import { Heading as HeadingComponent } from "~/app/(dashboard)/_components/heading";

type HeadingProps = {
  params: Promise<{ location: string; cohort: string }>;
};

async function HeadingContent(props: HeadingProps) {
  const params = await props.params;

  return <HeadingComponent>{`Cohort ${params.cohort}`}</HeadingComponent>;
}

function HeadingFallback() {
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
