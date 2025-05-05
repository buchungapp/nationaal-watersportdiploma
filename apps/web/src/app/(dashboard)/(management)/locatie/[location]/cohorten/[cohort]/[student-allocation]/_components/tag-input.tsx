"use client";

import { useOptimisticAction } from "next-safe-action/hooks";
import { useCallback, useRef } from "react";
import { ReactTags, type Tag } from "react-tag-autocomplete";
import { toast } from "sonner";
import { updateStudentTagsInCohortAction } from "~/actions/cohort/student/update-student-tags-in-cohort-action";

export function ManageAllocationTags({
  tags,
  allocationId,
  cohortId,
  allCohortTags = [],
}: {
  tags: string[];
  allocationId: string;
  cohortId: string;
  allCohortTags?: string[];
}) {
  const toastId = useRef<string | number>(null);
  const { execute, optimisticState } = useOptimisticAction(
    updateStudentTagsInCohortAction.bind(null, cohortId),
    {
      currentState: tags,
      updateFn: (_current, newTags) => {
        if (Array.isArray(newTags)) {
          return newTags.flatMap((tag) => tag.tags);
        }

        return newTags.tags;
      },
      onExecute: () => {
        toastId.current = toast.loading("Tags wijzigen");
      },
      onSuccess: () => {
        if (toastId.current) {
          toast.dismiss(toastId.current);
        }

        toast.success("Tags gewijzigd");
      },
      onError: () => {
        if (toastId.current) {
          toast.dismiss(toastId.current);
        }

        toast.error("Er is iets misgegaan");
      },
    },
  );

  const onAdd = useCallback(
    async (tag: Tag) => {
      const newTags = [...optimisticState, tag.label];
      execute({
        allocationId,
        tags: newTags,
      });
    },
    [execute, allocationId, optimisticState],
  );

  const onDelete = useCallback(
    async (index: number) => {
      const newTags = [...optimisticState];
      newTags.splice(index, 1);

      execute({
        allocationId,
        tags: newTags,
      });
    },
    [execute, allocationId, optimisticState],
  );

  return (
    <ReactTags
      labelText={undefined}
      selected={optimisticState.map((tag) => ({ label: tag, value: tag }))}
      suggestions={
        allCohortTags
          .filter((tag) => !optimisticState.includes(tag))
          .map((tag) => ({ label: tag, value: tag })) as Tag[]
      }
      onAdd={onAdd}
      onDelete={onDelete}
      newOptionText="%value% toevoegen"
      placeholderText="Tag toevoegen"
      onValidate={(tag) => tag.trim().length > 0}
      allowNew
      activateFirstOption
    />
  );
}
