import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  LayoutCard,
  LayoutMultiCard,
} from "~/app/(dashboard)/_components/layout-card";
import { RouterPreviousButton } from "~/app/(dashboard)/_components/navigation";
import { AllocationCard } from "./_components/allocation-card";
import { CourseCard } from "./_components/course-card";
import { ManageStudentActions } from "./_components/manage-student-actions";
import { ManageStudentCurriculumActions } from "./_components/manage-student-curriculum-actions";
import { Programs } from "./_components/programs";
import Timeline from "./_components/timeline";

export default function Page(props: {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
}) {
  return (
    <LayoutMultiCard>
      <div className="max-lg:hidden">
        <RouterPreviousButton>Overzicht</RouterPreviousButton>
      </div>

      <div className="items-start gap-2 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-4 lg:max-w-none max-w-2xl">
        <LayoutCard className="lg:col-start-3 lg:row-end-1">
          <div className="flex justify-between items-center mb-3">
            <Subheading>Cursist</Subheading>
            <ManageStudentActions params={props.params} />
          </div>
          <AllocationCard params={props.params} />
        </LayoutCard>

        <Timeline params={props.params} />

        <Programs params={props.params} />

        <LayoutCard className="lg:col-span-2 lg:row-span-3 lg:row-end-3">
          <div className="flex justify-between items-center mb-3">
            <Subheading>Cursuskaart</Subheading>
            <ManageStudentCurriculumActions params={props.params} />
          </div>
          <CourseCard params={props.params} />
        </LayoutCard>
      </div>
    </LayoutMultiCard>
  );
}
