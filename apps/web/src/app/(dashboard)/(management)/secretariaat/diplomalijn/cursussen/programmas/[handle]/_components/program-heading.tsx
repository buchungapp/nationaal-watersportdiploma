import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listPrograms } from "~/lib/nwd";

type ProgramHeadingProps = {
  params: Promise<{ handle: string }>;
};

async function ProgramHeadingContent({ params }: ProgramHeadingProps) {
  const { handle } = await params;
  const program = await listPrograms().then((programs) =>
    programs.find((program) => program.handle === handle),
  );

  if (!program) {
    return notFound();
  }

  return (
    <Heading>
      {program.title ?? `${program.course.title} ${program.degree.title}`}
    </Heading>
  );
}

export function ProgramHeadingFallback() {
  return (
    <Heading>
      <span className="inline-block bg-gray-200 rounded w-48 h-6 align-middle animate-pulse" />
    </Heading>
  );
}

export function ProgramHeading({ params }: ProgramHeadingProps) {
  return (
    <Suspense fallback={<ProgramHeadingFallback />}>
      <ProgramHeadingContent params={params} />
    </Suspense>
  );
}
