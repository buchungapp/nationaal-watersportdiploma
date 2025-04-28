import clsx from "clsx";
import { notFound } from "next/navigation";
import React from "react";
import BackButton from "~/app/(dashboard)/(management)/_components/back-button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Code, TextLink } from "~/app/(dashboard)/_components/text";
import {
  listCourses,
  listCurriculaByDiscipline,
  listParentCategories,
  listProgramsForCourse,
} from "~/lib/nwd";
import { Weight } from "../../../../../../_components/weight";

export default async function Page(props: {
  params: Promise<{
    handle: string;
  }>;
}) {
  const params = await props.params;
  const [course, parentCategories] = await Promise.all([
    listCourses().then((courses) =>
      courses.find((course) => course.handle === params.handle),
    ),
    listParentCategories(),
  ]);

  if (!course) {
    notFound();
  }

  const [programs, curricula] = await Promise.all([
    listProgramsForCourse(course.id),
    listCurriculaByDiscipline(course.discipline.id),
  ]);

  const uniqueModules = curricula
    .filter((curriculum) =>
      programs.some((program) => program.id === curriculum.programId),
    )
    .flatMap((curriculum) => curriculum.modules)
    .filter(
      (module, index, self) =>
        self.findIndex((m) => m.id === module.id) === index,
    )
    .sort((a, b) => a.weight - b.weight);

  return (
    <>
      <BackButton href={"/secretariaat/diplomalijn/cursussen"}>
        Cursussen
      </BackButton>
      <Heading>{course.title}</Heading>

      <DescriptionList className="mt-10">
        <DescriptionTerm>Handle</DescriptionTerm>
        <DescriptionDetails>
          <Code>{course.handle}</Code>
        </DescriptionDetails>

        <DescriptionTerm>Discipline</DescriptionTerm>
        <DescriptionDetails>{course.discipline.title}</DescriptionDetails>

        {parentCategories.map((category) => (
          <React.Fragment key={category.id}>
            <DescriptionTerm>{category.title}</DescriptionTerm>
            <DescriptionDetails>
              {course.categories.find((c) => c.parent?.id === category.id)
                ?.title ?? "-"}
            </DescriptionDetails>
          </React.Fragment>
        ))}
      </DescriptionList>

      <Divider className="my-10" />

      <Table dense className="max-w-3xl">
        <TableHead>
          <TableRow>
            <TableHeader />
            <TableHeader>Module</TableHeader>
            {programs.map((program) => (
              <TableHeader key={program.id} className="text-center">
                <TextLink
                  href={`/secretariaat/diplomalijn/cursussen/programmas/${program.handle}`}
                >
                  {program.degree.title}
                </TextLink>
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {uniqueModules.map((module) => (
            <TableRow key={module.id}>
              <TableCell>
                <Weight weight={module.weight} />
              </TableCell>
              <TableCell>{module.title}</TableCell>
              {programs.map((program) => {
                const curriculum = curricula.find(
                  (curriculum) =>
                    curriculum.programId === program.id &&
                    curriculum.modules.some(
                      (curriculumModule) => curriculumModule.id === module.id,
                    ),
                );

                const programModule = curriculum?.modules.find(
                  (curriculumModule) => curriculumModule.id === module.id,
                );

                return (
                  <TableCell
                    key={program.id}
                    className={clsx(
                      "text-center",
                      programModule
                        ? programModule.isRequired
                          ? "bg-pink-100"
                          : "bg-blue-100"
                        : "bg-slate-100",
                    )}
                  >
                    {programModule
                      ? programModule.isRequired
                        ? "✔"
                        : "❍"
                      : ""}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
