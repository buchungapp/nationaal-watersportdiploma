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
import { Input } from "~/app/(dashboard)/_components/input";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateCurriculaCompetencyRequirementAction } from "~/app/_actions/secretariat/curricula/update-curriculum-competency-requirement-action";
import Spinner from "~/app/_components/spinner";

export function EditRequirementDialog({
  competency,
}: {
  competency: {
    id: string;
    title: string | null;
    requirement: string | null;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { execute, input } = useAction(
    updateCurriculaCompetencyRequirementAction.bind(null, competency.id),
    {
      onSuccess: () => {
        setIsOpen(false);
        toast.success("Vereiste bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    requirement: competency.requirement ?? "",
  });

  return (
    <>
      <Button outline className="-my-1.5" onClick={() => setIsOpen(true)}>
        <PencilIcon />
      </Button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>
          Wijzig vereiste {competency.title ? `van '${competency.title}'` : ""}
        </DialogTitle>
        <DialogBody>
          <form action={execute}>
            <Fieldset>
              <Field>
                <Label>Vereiste</Label>
                <Input
                  name="requirement"
                  defaultValue={getInputValue("requirement")}
                  required
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
