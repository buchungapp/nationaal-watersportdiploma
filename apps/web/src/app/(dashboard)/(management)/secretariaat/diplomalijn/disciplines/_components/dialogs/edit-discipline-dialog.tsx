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
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateDisciplineAction } from "~/app/_actions/secretariat/discipline/update-discipline-action";
import Spinner from "~/app/_components/spinner";

export function EditDisciplineDialog({
  discipline,
}: {
  discipline: {
    id: string;
    title: string | null;
    weight: number | null;
  };
}) {
  const [isOpen, setisOpen] = useState(false);

  const { execute, input } = useAction(
    updateDisciplineAction.bind(null, discipline.id),
    {
      onSuccess: () => {
        setisOpen(false);
        toast.success("Discipline bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    title: discipline.title,
    weight: discipline.weight,
  });

  return (
    <>
      <Button outline className="-my-1.5" onClick={() => setisOpen(true)}>
        <PencilIcon />
        Bewerken
      </Button>

      <Dialog open={isOpen} onClose={() => setisOpen(false)}>
        <DialogTitle>
          Wijzig discipline{discipline.title ? ` '${discipline.title}'` : ""}
        </DialogTitle>
        <DialogBody>
          <form action={execute}>
            <Fieldset>
              <FieldGroup>
                <Field>
                  <Label>Naam</Label>
                  <Input
                    name="title"
                    defaultValue={getInputValue("title")}
                    required
                  />
                </Field>
                <Field>
                  <Label>Sortering</Label>
                  <Input
                    name="weight"
                    type="number"
                    min={0}
                    defaultValue={getInputValue("weight")}
                    required
                  />
                </Field>
              </FieldGroup>
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
