import clsx from "clsx";
import { Suspense } from "react";
import { Weight } from "~/app/_components/weight";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { TextLink } from "~/app/(dashboard)/_components/text";
import {
  listCourses,
  listCurriculaByDiscipline,
  listProgramsForCourse,
} from "~/lib/nwd";

type CourseModulesProps = {
  params: Promise<{ handle: string }>;
};

async function CourseModulesContent({ params }: CourseModulesProps) {
  const { handle } = await params;
  const course = await listCourses().then((courses) =>
    courses.find((course) => course.handle === handle),
  );

  if (!course) {
    return null;
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
                  {programModule ? (programModule.isRequired ? "✔" : "❍") : ""}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CourseModulesFallback() {
  return (
    <Table dense className="max-w-3xl">
      <TableHead>
        <TableRow>
          <TableHeader />
          <TableHeader>Module</TableHeader>
          {[1, 2, 3].map((i) => (
            <TableHeader key={i} className="text-center">
              <span className="inline-block bg-gray-200 rounded w-24 h-4 align-middle animate-pulse" />
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {[1, 2, 3].map((i) => (
          <TableRow key={i}>
            <TableCell>
              <span className="inline-block bg-gray-200 rounded w-8 h-4 align-middle animate-pulse" />
            </TableCell>
            <TableCell>
              <span className="inline-block bg-gray-200 rounded w-32 h-4 align-middle animate-pulse" />
            </TableCell>
            {[1, 2, 3].map((j) => (
              <TableCell key={j} className="text-center">
                <span className="inline-block bg-gray-200 rounded w-4 h-4 align-middle animate-pulse" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CourseModules({ params }: CourseModulesProps) {
  return (
    <Suspense fallback={<CourseModulesFallback />}>
      <CourseModulesContent params={params} />
    </Suspense>
  );
}
