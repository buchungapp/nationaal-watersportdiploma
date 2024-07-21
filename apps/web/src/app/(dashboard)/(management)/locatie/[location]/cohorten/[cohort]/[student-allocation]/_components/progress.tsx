"use client";

import { ArrowPathRoundedSquareIcon } from "@heroicons/react/16/solid";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import Spinner from "~/app/_components/spinner";
import { makeProgressVisible } from "../_actions/progress";

export function UpdateProgressVisibility({
  allocationId,
  cohortId,
}: {
  allocationId: string;
  cohortId: string;
}) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      plain
      className="shrink-0"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await makeProgressVisible({ allocationId, cohortId })
            .then(() => toast.success("Voortgang zichtbaar gemaakt"))
            .catch(() => toast.error("Er is iets misgegaan"));
        });
      }}
    >
      {pending ? <Spinner /> : <ArrowPathRoundedSquareIcon />}
    </Button>
  );
}
