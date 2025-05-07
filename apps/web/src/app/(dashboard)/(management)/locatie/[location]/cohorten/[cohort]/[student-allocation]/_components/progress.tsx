"use client";

import { ArrowPathRoundedSquareIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import { makeProgressVisibleForStudentInCohortAction } from "~/app/_actions/cohort/student/make-progress-visible-for-student-in-cohort-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";

export function UpdateProgressVisibility({
  allocationId,
  cohortId,
}: {
  allocationId: string;
  cohortId: string;
}) {
  const { execute, isPending } = useAction(
    makeProgressVisibleForStudentInCohortAction.bind(
      null,
      cohortId,
      allocationId,
    ),
    {
      onSuccess: () => {
        toast.success("Voortgang zichtbaar gemaakt");
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  return (
    <Button
      plain
      className="shrink-0"
      disabled={isPending}
      onClick={() => execute()}
    >
      {isPending ? <Spinner /> : <ArrowPathRoundedSquareIcon />}
    </Button>
  );
}
