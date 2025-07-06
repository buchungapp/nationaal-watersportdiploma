import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listCourses,
  listKssNiveaus,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import CreatePvbForm from "./_components/create-pvb-form";

async function CreatePvbContent(props: {
  params: Promise<{ location: string }>;
  searchParams: Promise<{
    niveau?: string;
    [key: string]: string | undefined;
  }>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const location = await retrieveLocationByHandle(params.location);

  // Fetch required data for the form
  const [niveausResult, coursesResult] = await Promise.all([
    listKssNiveaus(),
    listCourses("consument", location.id),
  ]);

  // Transform courses to match the expected interface (filter out nulls)
  const niveaus = niveausResult.filter(
    (niveau): niveau is typeof niveau & { rang: number } => niveau.rang < 4,
  );
  const courses = coursesResult
    .filter(
      (course): course is typeof course & { title: string } =>
        course.title !== null,
    )
    .map((course) => ({
      id: course.id,
      title: course.title,
    }));

  return (
    <CreatePvbForm
      locationId={location.id}
      niveaus={niveaus}
      courses={courses}
      selectedNiveauId={searchParams.niveau || ""}
    />
  );
}

export default function Page(props: {
  params: Promise<{ location: string }>;
  searchParams: Promise<{
    niveau?: string;
    [key: string]: string | undefined;
  }>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Nieuwe PvB aanvragen</Heading>
          <p className="mt-2 text-zinc-600">
            Maak meerdere PvB aanvragen tegelijk aan voor verschillende
            kandidaten.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div>Laden...</div>}>
          <CreatePvbContent
            params={props.params}
            searchParams={props.searchParams}
          />
        </Suspense>
      </div>
    </>
  );
}
