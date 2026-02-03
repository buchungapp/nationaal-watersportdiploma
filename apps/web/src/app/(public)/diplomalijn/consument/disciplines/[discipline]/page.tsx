"use cache";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listCourses, retrieveDisciplineByHandle } from "~/lib/nwd";

export default async function Page(props: {
  params: Promise<{
    discipline: string;
  }>;
}) {
  cacheLife("days");

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
      <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900">
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
              <h2 className="text-lg/6 font-semibold my-0 text-slate-900">
                {course.title}
              </h2>
              <ChevronRightIcon className="size-6 text-slate-900" />
            </Link>
          </li>
        ))}
      </ul>

      {params.discipline === "jachtzeilen" && (
        <div className="mt-12 border-t border-slate-200">
          <h2 className="text-lg/6 font-semibold mb-4">
            Vaarwateren voor jachtzeilen
          </h2>
          <p className="mb-6">
            Op onderstaande kaart zie je de verschillende vaarwateren voor
            jachtzeilen. De Hollandse kuststrook en de grote Zeeuwse meren
            kunnen gebruikt worden voor twee verschillende diplomalijnen. Welke
            diplomalijn van toepassing is, hangt af van de grootte van de boot
            en het niveau van de opleiding. Je vaarschool kan je precies
            vertellen welke diplomalijn voor jouw situatie van toepassing is.
          </p>
          <Image
            src={
              (await import("../../_assets/vaarwateren-jachtzeilen.png"))
                .default
            }
            alt="Vaarwateren jachtzeilen"
            className="mb-8"
          />

          <h2 className="text-lg/6 font-semibold mb-4">
            Niveaus in het jachtzeilen
          </h2>
          <p className="mb-6">
            Ook in het jachtzeilen werken we met vier niveaus. Elk niveau bouwt
            voort op het vorige en geeft aan wat je als zeiler kunt en mag doen.
            De niveaus zijn gebaseerd op je vaardigheden, kennis en ervaring met
            verschillende weersomstandigheden.
          </p>
          <table>
            <thead>
              <tr>
                <th>Niveau</th>
                <th>Benaming</th>
                <th>Omschrijving</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Opstapper</td>
                <td>
                  Kan veilig meevaren op een zeiljacht en daarbij de bemanning
                  in manoeuvres assisteren.
                </td>
              </tr>
              <tr>
                <td>2</td>
                <td>Bemanningslid</td>
                <td>
                  Kan aan boord van een zeiljacht zelfstandig benodigde taken
                  uitvoeren onder verantwoordelijkheid van de schipper.
                </td>
              </tr>
              <tr>
                <td>3</td>
                <td>Dagschipper</td>
                <td>
                  Kan schipper zijn op een zeiljacht gedurende dagtochten met
                  een windkracht van maximaal 4 beaufort.
                </td>
              </tr>
              <tr>
                <td>4</td>
                <td>Schipper</td>
                <td>
                  Kan schipper zijn op een zeiljacht gedurende dag en nacht met
                  een windkracht van maximaal 5 beaufort.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
