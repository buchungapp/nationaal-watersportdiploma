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
import { listCourses } from "~/lib/nwd";
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
  const { personId } = await params;
  const { course: selectedCourseId } = await searchParams;

  return (
    <>
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
    </>
  );
}
