"use client";

import { PencilIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";

import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Field, Fieldset, Label } from "~/app/(dashboard)/_components/fieldset";
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateCurriculaGearTypesAction } from "~/app/_actions/secretariat/curricula/update-curriculum-gear-types-action";
import Spinner from "~/app/_components/spinner";
import type { listGearTypes, listGearTypesByCurriculum } from "~/lib/nwd";

export function EditGearTypesDialog({
  curriculumId,
  allGearTypes,
  currentGearTypes,
}: {
  curriculumId: string;
  allGearTypes: Awaited<ReturnType<typeof listGearTypes>>;
  currentGearTypes: Awaited<ReturnType<typeof listGearTypesByCurriculum>>;
}) {
  const [isOpen, setisOpen] = useState(false);

  const { execute, input } = useAction(
    updateCurriculaGearTypesAction.bind(null, curriculumId),
    {
      onSuccess: () => {
        setisOpen(false);
        toast.success("Boottypen bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    gearTypes: currentGearTypes.map((gearType) => gearType.id),
  });

  const defaultGearTypes = getInputValue("gearTypes");

  return (
    <>
      <Button outline className="-my-1.5" onClick={() => setisOpen(true)}>
        <PencilIcon />
      </Button>

      <Dialog open={isOpen} onClose={() => setisOpen(false)}>
        <DialogTitle>Wijzig boottypen</DialogTitle>
        <DialogBody>
          <form action={execute}>
            <Fieldset>
              <Field>
                <Label>Boottypen</Label>
                <Listbox
                  multiple
                  name="gearTypes"
                  defaultValue={defaultGearTypes}
                  key={defaultGearTypes?.join(",")} // Listbox does not update to new defaultValue, so reset field by changing key
                  className="w-full"
                >
                  {allGearTypes
                    .sort((a, b) => {
                      const aIsSelected =
                        defaultGearTypes?.includes(a.id) ?? false;
                      const bIsSelected =
                        defaultGearTypes?.includes(b.id) ?? false;
                      if (aIsSelected && !bIsSelected) return -1;
                      if (!aIsSelected && bIsSelected) return 1;
                      return 0;
                    })
                    .map((gearType) => (
                      <ListboxOption key={gearType.id} value={gearType.id}>
                        {gearType.title}
                      </ListboxOption>
                    ))}
                </Listbox>
              </Field>
            </Fieldset>
            <DialogActions>
              <SubmitButton />
            </DialogActions>
          </form>
        </DialogBody>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" color="blue" disabled={pending}>
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
