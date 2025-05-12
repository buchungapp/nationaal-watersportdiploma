import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Code } from "~/app/(dashboard)/_components/text";
import { listPrograms } from "~/lib/nwd";

type ProgramInfoProps = {
  params: Promise<{ handle: string }>;
};

async function ProgramInfoContent({ params }: ProgramInfoProps) {
  const { handle } = await params;
  const program = await listPrograms().then((programs) =>
    programs.find((program) => program.handle === handle),
  );

  if (!program) {
    return notFound();
  }

  return (
    <DescriptionList className="mt-10">
      <DescriptionTerm>Handle</DescriptionTerm>
      <DescriptionDetails>
        <Code>{program.handle}</Code>
      </DescriptionDetails>

      <DescriptionTerm>Programma</DescriptionTerm>
      <DescriptionDetails>{program.course.title}</DescriptionDetails>

      <DescriptionTerm>Niveau</DescriptionTerm>
      <DescriptionDetails>{program.degree.title}</DescriptionDetails>
    </DescriptionList>
  );
}

export function ProgramInfoFallback() {
  return (
    <DescriptionList className="mt-10">
      <DescriptionTerm>Handle</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-32 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Programma</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-24 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Niveau</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-4 h-4 align-middle animate-pulse" />
      </DescriptionDetails>
    </DescriptionList>
  );
}

export function ProgramInfo({ params }: ProgramInfoProps) {
  return (
    <Suspense fallback={<ProgramInfoFallback />}>
      <ProgramInfoContent params={params} />
    </Suspense>
  );
}
