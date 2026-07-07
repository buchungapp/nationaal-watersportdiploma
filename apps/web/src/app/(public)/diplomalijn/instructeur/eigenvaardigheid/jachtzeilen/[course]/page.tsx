import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EigenvaardigheidCourseDetail } from "../../../_components/eigenvaardigheid-course-detail";
import {
  JACHTZEILEN_EV_BASE,
  JACHTZEILEN_EV_HANDLE,
} from "../../../_data/jachtzeilen-ev";
import {
  retrieveCourseByHandle,
  retrieveDisciplineByHandle,
} from "~/lib/nwd";

export const generateMetadata = async (props: {
  params: Promise<{ course: string }>;
}): Promise<Metadata> => {
  const { course: courseHandle } = await props.params;
  const course = await retrieveCourseByHandle(courseHandle);
  if (!course) return {};

  return {
    title: `Eigenvaardigheid ${course.title ?? courseHandle}`,
    description: `NWD A, B en C voor ${course.title ?? courseHandle}`,
  };
};

export default async function Page(props: {
  params: Promise<{ course: string }>;
}) {
  const { course: courseHandle } = await props.params;

  const [discipline, course] = await Promise.all([
    retrieveDisciplineByHandle(JACHTZEILEN_EV_HANDLE),
    retrieveCourseByHandle(courseHandle),
  ]);

  if (!discipline || !course) {
    notFound();
  }

  if (course.discipline.id !== discipline.id) {
    notFound();
  }

  if (!course.handle.endsWith("-instructeurs")) {
    notFound();
  }

  const disciplineTitle = discipline.title ?? "Jachtzeilen";
  const courseTitle = course.title ?? courseHandle;

  return (
    <EigenvaardigheidCourseDetail
      course={course}
      disciplineId={discipline.id}
      disciplineTitle={disciplineTitle}
      heading={`Eigenvaardigheid ${courseTitle}`}
      breadcrumbs={[
        {
          label: "Eigenvaardigheid",
          href: "/diplomalijn/instructeur/eigenvaardigheid",
        },
        {
          label: disciplineTitle,
          href: JACHTZEILEN_EV_BASE,
        },
        {
          label: courseTitle,
          href: `${JACHTZEILEN_EV_BASE}/${courseHandle}`,
        },
      ]}
    />
  );
}
