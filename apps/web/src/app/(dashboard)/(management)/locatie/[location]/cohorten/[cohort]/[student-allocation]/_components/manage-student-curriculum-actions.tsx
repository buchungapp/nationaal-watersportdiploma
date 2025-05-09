import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import {
  listCompetencyProgressInCohortForStudent,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import { WithdrawStudentCurriculum } from "./actions";

type ManageStudentCurriculumActionsProps = {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
};

async function ManageStudentCurriculumActionsContent(
  props: ManageStudentCurriculumActionsProps,
) {
  const params = await props.params;

  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  const [allocation, progress] = await Promise.all([
    retrieveStudentAllocationWithCurriculum(
      cohort.id,
      params["student-allocation"],
    ),
    listCompetencyProgressInCohortForStudent(params["student-allocation"]),
  ]);

  if (!allocation?.studentCurriculum) {
    return null;
  }

  const notNullProgress = progress.filter((p) => Number(p.progress) > 0);

  return (
    <Dropdown>
      <DropdownButton outline className="-my-1.5">
        <EllipsisHorizontalIcon />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        <WithdrawStudentCurriculum
          cohortId={cohort.id}
          studentAllocationId={params["student-allocation"]}
          locationId={location.id}
          disabled={!!allocation.certificate || notNullProgress.length > 0}
        />
      </DropdownMenu>
    </Dropdown>
  );
}

export function ManageStudentCurriculumActionsFallback() {
  return (
    <div className="flex items-center gap-1 -my-1.5 animate-pulse shrink-0">
      <div className="bg-slate-200 rounded-lg size-9" />
    </div>
  );
}

export function ManageStudentCurriculumActions(
  props: ManageStudentCurriculumActionsProps,
) {
  return (
    <Suspense fallback={<ManageStudentCurriculumActionsFallback />}>
      <ManageStudentCurriculumActionsContent {...props} />
    </Suspense>
  );
}
