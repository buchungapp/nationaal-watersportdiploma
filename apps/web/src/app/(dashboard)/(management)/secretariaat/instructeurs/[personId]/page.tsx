import { User } from "@nawadi/core";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import {
  getAllExistingKerntaakOnderdeelIdsByCourse,
  getAvailableKerntaakonderdelen,
  getPersonKwalificaties,
} from "~/app/_actions/kss/manage-kwalificaties";
import { getUserOrThrow, listCourses } from "~/lib/nwd";
import { isSecretariaat } from "~/utils/auth/is-secretariaat";
import { isSystemAdmin } from "~/utils/auth/is-system-admin";
import KwalificatiesTable from "./_components/kwalificaties-table";
import { PersonInfo } from "./_components/person-info";

async function KwalificatiesContent({
  personId,
  selectedCourseId,
}: {
  personId: string;
  selectedCourseId?: string;
}) {
  const person = await User.Person.byIdOrHandle({ id: personId });

  if (!person) {
    notFound();
  }

  const [courses, detailedKwalificaties] = await Promise.all([
    listCourses(),
    getPersonKwalificaties(person.id),
  ]);

  // Prepare the kerntaakonderdelen promise without awaiting it
  const kerntaakonderdelenPromise = getAvailableKerntaakonderdelen();

  // Get all existing kerntaak onderdeel IDs for the person, grouped by course
  const existingKerntaakOnderdeelIdsByCoursePromise =
    getAllExistingKerntaakOnderdeelIdsByCourse(person.id);

  return (
    <>
      <PersonInfo person={person} />
      <KwalificatiesTable
        personId={person.id}
        detailedKwalificaties={detailedKwalificaties}
        courses={courses}
        kerntaakonderdelenPromise={kerntaakonderdelenPromise}
        existingKerntaakOnderdeelIdsByCoursePromise={
          existingKerntaakOnderdeelIdsByCoursePromise
        }
      />
    </>
  );
}

export default async function PersonKwalificatiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const user = await getUserOrThrow();

  // Check if user is system admin or secretariaat
  if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
    return (
      <div className="mx-auto max-w-7xl">
        <Heading level={1}>Geen toegang</Heading>
        <Text className="mt-2">Je hebt geen toegang tot deze pagina.</Text>
      </div>
    );
  }

  const { personId } = await params;
  const { course: selectedCourseId } = await searchParams;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <Heading level={1}>Kwalificaties beheren</Heading>
        <Text className="mt-2">
          Beheer de kwalificaties van deze persoon. Je kunt kwalificaties
          toevoegen of verwijderen.
        </Text>
      </div>

      <Suspense fallback={<div>Laden...</div>}>
        <KwalificatiesContent
          personId={personId}
          selectedCourseId={selectedCourseId}
        />
      </Suspense>
    </div>
  );
}
