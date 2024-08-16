import { notFound } from "next/navigation";
import BackButton from "~/app/(dashboard)/(management)/_components/back-button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Code } from "~/app/(dashboard)/_components/text";
import { listCurriculaByProgram, listPrograms } from "~/lib/nwd";
import Curriculum from "./_components/curriculum";

export default async function Page({
  params,
}: Readonly<{ params: { handle: string } }>) {
  const program = await listPrograms().then((programs) =>
    programs.find((program) => program.handle === params.handle),
  );

  if (!program) {
    notFound();
  }

  const [curricula] = await Promise.all([
    listCurriculaByProgram(program.id, false),
  ]);

  const currentCurriculum =
    //   Most recent startedAt
    curricula
      .sort((a, b) => {
        // Without startedAt, should be on top
        if (!a.startedAt) return -1;
        if (!b.startedAt) return 1;
        return b.startedAt.localeCompare(a.startedAt);
      })
      .find((curriculum) => curriculum.startedAt);

  return (
    <>
      <BackButton
        href={`/secretariaat/diplomalijn/cursussen/${program.course.handle}`}
      >
        Cursus
      </BackButton>
      <Heading>
        {program.title ?? `${program.course.title} ${program.degree.title}`}
      </Heading>

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

      <Divider className="my-10" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading level={2}>Curricula</Heading>
      </div>

      <div className="mt-6">
        {curricula.map((curriculum) => (
          <Curriculum
            key={curriculum.id}
            curriculum={curriculum}
            isCurrent={currentCurriculum?.id === curriculum.id}
          />
        ))}
      </div>
    </>
  );
}
