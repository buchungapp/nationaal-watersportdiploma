import React, { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Code } from "~/app/(dashboard)/_components/text";
import { listCourses, listParentCategories } from "~/lib/nwd";

type CourseInfoProps = {
  params: Promise<{ handle: string }>;
};

async function CourseInfoContent({ params }: CourseInfoProps) {
  const { handle } = await params;
  const [course, parentCategories] = await Promise.all([
    listCourses().then((courses) =>
      courses.find((course) => course.handle === handle),
    ),
    listParentCategories(),
  ]);

  if (!course) {
    return null;
  }

  return (
    <DescriptionList className="mt-10">
      <DescriptionTerm>Handle</DescriptionTerm>
      <DescriptionDetails>
        <Code>{course.handle}</Code>
      </DescriptionDetails>

      <DescriptionTerm>Discipline</DescriptionTerm>
      <DescriptionDetails>{course.discipline.title}</DescriptionDetails>

      {parentCategories.map((category) => (
        <React.Fragment key={category.id}>
          <DescriptionTerm>{category.title}</DescriptionTerm>
          <DescriptionDetails>
            {course.categories
              .filter((c) => c.parent?.id === category.id)
              .map((c) => c.title ?? c.handle)
              .join(", ")}
          </DescriptionDetails>
        </React.Fragment>
      ))}
    </DescriptionList>
  );
}

export function CourseInfoFallback() {
  return (
    <DescriptionList className="mt-10">
      <DescriptionTerm>Handle</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-24 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Discipline</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-32 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      {[1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <DescriptionTerm>
            <span className="inline-block bg-gray-200 rounded w-24 h-4 align-middle animate-pulse" />
          </DescriptionTerm>
          <DescriptionDetails>
            <span className="inline-block bg-gray-200 rounded w-32 h-4 align-middle animate-pulse" />
          </DescriptionDetails>
        </React.Fragment>
      ))}
    </DescriptionList>
  );
}

export function CourseInfo({ params }: CourseInfoProps) {
  return (
    <Suspense fallback={<CourseInfoFallback />}>
      <CourseInfoContent params={params} />
    </Suspense>
  );
}
