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
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateCompetencyAction } from "~/app/_actions/secretariat/competency/update-competency-action";
import Spinner from "~/app/_components/spinner";

export function EditCompetencyDialog({
  competency,
}: {
  competency: {
    id: string;
    title: string | null;
    type: "skill" | "knowledge" | null;
    weight: number | null;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { execute, input } = useAction(
    updateCompetencyAction.bind(null, competency.id),
    {
      onSuccess: () => {
        setIsOpen(false);
        toast.success("Competentie bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    title: competency.title,
    type: competency.type,
    weight: competency.weight,
  });

  return (
    <>
      <Button outline className="-my-1.5" onClick={() => setIsOpen(true)}>
        <PencilIcon />
        Bewerken
      </Button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>
          Wijzig competentie{competency.title ? ` '${competency.title}'` : ""}
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
                  <Label>Type</Label>
                  <Listbox name="type" defaultValue={getInputValue("type")}>
                    <ListboxOption value="skill">Vaardigheid</ListboxOption>
                    <ListboxOption value="knowledge">Kennis</ListboxOption>
                  </Listbox>
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
