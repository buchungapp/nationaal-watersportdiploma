import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCourses } from "~/lib/nwd";

type CourseHeadingProps = {
  params: Promise<{ handle: string }>;
};

async function CourseHeadingContent({ params }: CourseHeadingProps) {
  const { handle } = await params;
  const course = await listCourses().then((courses) =>
    courses.find((course) => course.handle === handle),
  );

  if (!course) {
    return null;
  }

  return <Heading>{course.title}</Heading>;
}

export function CourseHeadingFallback() {
  return (
    <Heading>
      <span className="inline-block bg-gray-200 rounded w-48 h-6 align-middle animate-pulse" />
    </Heading>
  );
}

export function CourseHeading({ params }: CourseHeadingProps) {
  return (
    <Suspense fallback={<CourseHeadingFallback />}>
      <CourseHeadingContent params={params} />
    </Suspense>
  );
}
