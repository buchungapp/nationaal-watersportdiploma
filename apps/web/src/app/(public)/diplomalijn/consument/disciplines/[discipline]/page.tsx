import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listCourses, retrieveDisciplineByHandle } from "~/lib/nwd";

export default async function Page(
  props: {
    params: Promise<{
      discipline: string;
    }>;
  }
) {
  const params = await props.params;
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
      <ul className="list-none pl-0">
        {coursesForDiscipline.map((course) => (
          <li key={course.id} className="pl-0">
            <Link
              href={`/diplomalijn/consument/disciplines/${params.discipline}/${course.handle}`}
              className="flex justify-between items-center"
            >
              <h2 className="text-lg/6 font-semibold my-0 text-gray-900">
                {course.title}
              </h2>
              <ChevronRightIcon className="w-6 h-6 text-gray-900" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
