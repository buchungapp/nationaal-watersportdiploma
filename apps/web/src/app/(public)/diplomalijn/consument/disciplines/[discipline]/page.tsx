import Link from "next/link";
import { notFound } from "next/navigation";
import { listCourses, retrieveDisciplineByHandle } from "~/lib/nwd";

export default async function Page({
  params,
}: {
  params: {
    discipline: string;
  };
}) {
  const [discipline, courses] = await Promise.all([
    retrieveDisciplineByHandle(params.discipline),
    listCourses(),
  ]);

  if (!discipline) {
    notFound();
  }

  const coursesForDiscipline = courses.filter(
    (c) => c.discipline.id === discipline.id,
  );

  return (
    <div className="w-full">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
        Cursussen
      </h1>
      <p>
        Op deze pagina vind je een overzicht van de cursussen die onder de
        discipline <strong>{discipline.title}</strong> vallen.
      </p>
      {coursesForDiscipline.map((course) => (
        <Link
          href={`/diplomalijn/consument/disciplines/${params.discipline}/${course.handle}`}
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {course.title}
          </h2>
        </Link>
      ))}
    </div>
  );
}
