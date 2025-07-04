import { PlusIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { listCourses } from "~/lib/nwd";
import Search from "../../../_components/search";

type Instructiegroep = {
  id: string;
  title: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  courses: Array<{
    id: string;
    handle: string;
    title: string;
  }>;
};

async function InstructiegroepTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  // Since we can only get instructiegroepen by course ID, we'll create mock data for now
  // In a real implementation, we would need a proper API to list all instructiegroepen
  const mockInstructiegroepen: Instructiegroep[] = [];

  // Get all courses to understand what's available
  const courses = await listCourses();

  // For demonstration purposes, show a message that this needs API support
  return (
    <div className="mt-8">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Text className="text-lg">
          Instructiegroepen kunnen momenteel alleen via cursussen benaderd
          worden.
        </Text>
        <Text className="mt-2">
          Voor volledig beheer is een uitbreiding van de API nodig.
        </Text>
        <Text className="mt-4 text-sm text-gray-500">
          Beschikbare cursussen: {courses.length}
        </Text>
      </div>
    </div>
  );
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Instructiegroepen</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek instructiegroepen..." />
          </div>
        </div>
        <Button color="branding-orange" disabled>
          <PlusIcon />
          Nieuwe instructiegroep
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="mt-8 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Text>Laden...</Text>
          </div>
        }
      >
        <InstructiegroepTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
