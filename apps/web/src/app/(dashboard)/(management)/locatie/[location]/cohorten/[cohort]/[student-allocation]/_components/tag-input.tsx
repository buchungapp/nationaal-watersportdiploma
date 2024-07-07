"use client";

import { useCallback, useOptimistic } from "react";
import { ReactTags, type Tag } from "react-tag-autocomplete";
import { toast } from "sonner";
import { setTags } from "../../(overview)/_actions/nwd";

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
  // states

  const [optimisticTags, setOptimisticTags] = useOptimistic(
    tags,
    (_current, newTags: string[]) => newTags,
  );

  const onAdd = useCallback(
    async (tag: Tag) => {
      const newTags = [...optimisticTags, tag.label];
      setOptimisticTags(newTags);

      await setTags({
        allocationId,
        cohortId,
        tags: newTags,
      }).catch(() => {
        toast.error(
          `Er is iets misgegaan bij het toevoegen van de tag: ${tag.label}`,
        );
      });
    },
    [optimisticTags],
  );

  const onDelete = useCallback(
    async (index: number) => {
      const newTags = [...optimisticTags];
      newTags.splice(index, 1);

      setOptimisticTags(newTags);

      await setTags({
        allocationId,
        cohortId,
        tags: newTags,
      }).catch(() => {
        toast.error(`Er is iets misgegaan bij het verwijderen van de tag`);
      });
    },
    [optimisticTags],
  );

  return (
    <ReactTags
      labelText={undefined}
      selected={optimisticTags.map((tag) => ({ label: tag, value: tag }))}
      suggestions={
        allCohortTags
          .filter((tag) => !optimisticTags.includes(tag))
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
