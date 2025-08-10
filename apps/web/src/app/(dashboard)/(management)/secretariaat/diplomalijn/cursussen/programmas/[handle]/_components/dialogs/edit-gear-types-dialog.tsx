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
import { ListSelect } from "~/app/(dashboard)/_components/list-select";
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

  const { getInputValueAsArray } = useFormInput(input, {
    gearTypes: currentGearTypes.map((gearType) => gearType.id),
  });

  const defaultGearTypes = getInputValueAsArray("gearTypes");

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
                <ListSelect
                  options={allGearTypes}
                  by="id"
                  name="gearTypes"
                  minSelected={1}
                  defaultValue={defaultGearTypes}
                  displayValue={(gearType) => gearType.title ?? ""}
                  placeholder="Zoek boottypen..."
                />
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
