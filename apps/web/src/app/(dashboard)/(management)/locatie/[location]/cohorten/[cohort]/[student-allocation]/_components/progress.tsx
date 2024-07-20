"use client";

import { ArrowPathRoundedSquareIcon } from "@heroicons/react/16/solid";
import { Button } from "~/app/(dashboard)/_components/button";

export function UpdateProgressVisibility() {
  return (
    <Button
      plain
      className="shrink-0"
      onClick={async () => {
        //   await releaseStudent(cohortId, [studentAllocationId])
        //     .then(() => toast.success("Cursist vrijgegeven"))
        //     .catch(() => toast.error("Er is iets misgegaan"));
      }}
    >
      <ArrowPathRoundedSquareIcon />
    </Button>
  );
}
