import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "~/app/(public)/_components/breadcrumb";
import { ModuleOverview } from "~/app/(public)/diplomalijn/_components/module-overview";
import Program from "~/app/(public)/diplomalijn/_components/program";
import {
  listCurriculaByDiscipline,
  listProgramsForCourse,
  retrieveCourseByHandle,
  retrieveDisciplineByHandle,
} from "~/lib/nwd";

export default async function Page(props: {
  params: Promise<{
    discipline: string;
    course: string;
  }>;
}) {
  const params = await props.params;
  const [discipline, course] = await Promise.all([
    retrieveDisciplineByHandle(params.discipline),
    retrieveCourseByHandle(params.course),
  ]);

  if (!discipline || !course) {
    notFound();
  }

  const [allPrograms, curricula] = await Promise.all([
    listProgramsForCourse(course.id),
    listCurriculaByDiscipline(discipline.id),
  ]);

  // Consumenten-pagina: alleen consumentenniveaus (1 t/m 4). Instructeurs-
  // eigenvaardigheid (NWD A/B/C, rang >= 5 wanneer die in de DB komen) hoort
  // thuis onder /diplomalijn/instructeur/eigenvaardigheid en moet hier niet
  // opduiken.
  const programs = allPrograms.filter((program) => program.degree.rang <= 4);

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: discipline.title ?? "",
            href: `/diplomalijn/consument/disciplines/${params.discipline}`,
          },
          {
            label: course.title ?? "",
            href: `/diplomalijn/consument/disciplines/${params.discipline}/${params.course}`,
          },
        ]}
      />
      <h1 className="mt-4 font-semibold text-slate-900 text-xl">
        {course.title}
      </h1>

      <div className="mt-8">
        <div>
          <h2 className="text-slate-700">Moduleoverzicht</h2>
          <p className="text-sm">
            Een overzicht van modules die op verschillende niveaus worden
            aangeboden, en of deze tot de kern behoren, of een keuze zijn voor
            extra verdieping en/of verbreding. Voor meer informatie lees je{" "}
            <Link href="/help/artikel/hoe-is-de-diplomalijn-van-het-nwd-opgebouwd">
              Hoe is de diplomalijn van het NWD opgebouwd?
            </Link>
          </p>
        </div>

        <ModuleOverview programs={programs} curricula={curricula} />
      </div>

      <div className="mt-12 pb-4">
        <div className="pt-2 border-slate-300 border-t">
          <h2 className="text-slate-700">Programmaoverzicht</h2>
          <p className="text-sm">
            Een overzicht van de verschillende niveaus (programma's) voor deze
            cursus, met de bijbehorende competenties die per module worden
            aangeboden. Als ingelogd instructeur kun je ook de eisomschrijvingen
            voor deze competenties inzien.
          </p>
        </div>

        <ul className="space-y-6 pl-0 divide-y divide-zinc-950/5 list-none">
          {programs.map((program) => {
            return (
              <Program
                key={program.id}
                course={course}
                disciplineId={discipline.id}
                programId={program.id}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}
