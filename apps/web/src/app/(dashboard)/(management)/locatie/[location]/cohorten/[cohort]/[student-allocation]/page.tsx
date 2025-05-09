import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { RouterPreviousButton } from "~/app/(dashboard)/_components/navigation";
import { AllocationCard } from "./_components/allocation-card";
import { CourseCard } from "./_components/course-card";
import { ManageStudentActions } from "./_components/manage-student-actions";
import { ManageStudentCurriculumActions } from "./_components/manage-student-curriculum-actions";
import Timeline from "./_components/timeline";

export default async function Page(props: {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
}) {
  return (
    <>
      <div className="max-lg:hidden">
        <RouterPreviousButton>Overzicht</RouterPreviousButton>
      </div>

      <div className="items-start gap-x-8 gap-y-8 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-8 lg:max-w-none max-w-2xl">
        <div className="lg:col-start-3 lg:row-end-1">
          <div className="flex justify-between items-center">
            <Subheading>Cursist</Subheading>
            <ManageStudentActions params={props.params} />
          </div>
          <Divider className="mt-4" />
          <AllocationCard params={props.params} />
        </div>

        <Timeline params={props.params} />

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <div className="flex justify-between items-center">
            <Subheading>Cursuskaart</Subheading>
            <ManageStudentCurriculumActions params={props.params} />
          </div>
          <Divider className="mt-4" />
          <CourseCard params={props.params} />
        </div>
      </div>
    </>
  );
}
