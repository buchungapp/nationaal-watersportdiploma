import { notFound } from "next/navigation";
import { Suspense } from "react";
import BackButton from "~/app/(dashboard)/(management)/_components/back-button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  listDisciplines,
  listParentCategories,
  retrieveCourseByHandle,
} from "~/lib/nwd";
import { listCategories } from "~/lib/nwd";
import { EditCourseDialog } from "../_components/dialogs/edit-course-dialog";
import { CourseHeading } from "./_components/course-heading";
import { CourseInfo } from "./_components/course-info";
import { CourseModules } from "./_components/course-modules";

type PageProps = {
  params: Promise<{
    handle: string;
  }>;
};

async function EditCourseDialogSuspense({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const course = await retrieveCourseByHandle(handle);

  if (!course) {
    notFound();
  }

  const [parentCategories, disciplines, allCategories] = await Promise.all([
    listParentCategories(),
    listDisciplines(),
    listCategories(),
  ]);

  return (
    <EditCourseDialog
      course={course}
      parentCategories={parentCategories}
      disciplines={disciplines}
      allCategories={allCategories}
    />
  );
}

export default async function Page({ params }: PageProps) {
  return (
    <>
      <BackButton href={"/secretariaat/diplomalijn/cursussen"}>
        Cursussen
      </BackButton>
      <div className="flex sm:flex-row flex-col sm:justify-between gap-4">
        <CourseHeading params={params} />
        <Suspense
          fallback={<div className="rounded-lg w-40.5 h-9 animate-pulse" />}
        >
          <EditCourseDialogSuspense params={params} />
        </Suspense>
      </div>
      <CourseInfo params={params} />
      <Divider className="my-10" />
      <CourseModules params={params} />
    </>
  );
}
