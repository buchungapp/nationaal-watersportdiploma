import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Programs } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/programs";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  LayoutCardDisclosure,
  LayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/layout-card";
import {
  getPersonById,
  listCurriculaByPersonId,
  listCurriculaProgressByPersonId,
  listRolesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";

type PersonCertificatesProps = {
  params: Promise<{
    location: string;
    id: string;
  }>;
};

async function PersonCertificatesContent(props: PersonCertificatesProps) {
  const params = await props.params;
  const retrieveLocationPromise = retrieveLocationByHandle(params.location);
  const retrievePersonPromise = retrieveLocationPromise.then(
    async (location) => {
      const person = await getPersonById(params.id, location.id);

      if (!person) {
        notFound();
      }

      return person;
    },
  );

  const [person, rolesInLocation, location] = await Promise.all([
    retrievePersonPromise,
    retrievePersonPromise.then(async (person) => {
      const location = await retrieveLocationPromise;

      return listRolesForLocation(location.id, person.id);
    }),
    retrieveLocationPromise,
  ]);

  const isStudentOrInstructor = rolesInLocation.some((role) =>
    ["student", "instructor"].includes(role),
  );

  if (!isStudentOrInstructor) return null;

  const curricula = await listCurriculaByPersonId(person.id, true).then(
    (curricula) =>
      curricula.sort((a, b) => {
        const course = b.curriculum.program.course.handle.localeCompare(
          a.curriculum.program.course.handle,
        );
        const disciplineWeight =
          b.curriculum.program.course.discipline.weight -
          a.curriculum.program.course.discipline.weight;
        const degreeRank =
          b.curriculum.program.degree.rang - a.curriculum.program.degree.rang;

        return course !== 0
          ? course
          : disciplineWeight !== 0
            ? disciplineWeight
            : degreeRank;
      }),
  );
  const curriculaProgress = await listCurriculaProgressByPersonId(
    person.id,
    false,
    false,
  );

  return (
    <>
      <LayoutCardDisclosure
        header={
          <div className="flex justify-between items-center">
            <Subheading>Opleidingen</Subheading>
            <LayoutCardDisclosureChevron />
          </div>
        }
        className="mt-2"
      >
        <div className="mt-4">
          <Programs
            curricula={curricula}
            curriculaProgress={curriculaProgress}
            id={"curriculum"}
          />
        </div>
      </LayoutCardDisclosure>
    </>
  );
}

export function PersonCertificatesFallback() {
  return (
    <div className="block bg-gray-200 mt-2 rounded-lg w-full h-16 animate-pulse" />
  );
}

export function PersonCertificates(props: PersonCertificatesProps) {
  return (
    <Suspense fallback={<PersonCertificatesFallback />}>
      <PersonCertificatesContent {...props} />
    </Suspense>
  );
}
