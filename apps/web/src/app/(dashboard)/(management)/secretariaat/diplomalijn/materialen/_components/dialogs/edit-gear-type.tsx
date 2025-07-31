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
import { updateGearTypeAction } from "~/app/_actions/secretariat/gear-type/update-gear-type-action";
import Spinner from "~/app/_components/spinner";

export function EditGearTypeDialog({
  gearType,
}: {
  gearType: {
    id: string;
    title: string | null;
  };
}) {
  const [isOpen, setisOpen] = useState(false);

  const { execute, input } = useAction(
    updateGearTypeAction.bind(null, gearType.id),
    {
      onSuccess: () => {
        setisOpen(false);
        toast.success("Boottype bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    title: gearType.title,
  });

  return (
    <>
      <Button outline className="-my-1.5" onClick={() => setisOpen(true)}>
        <PencilIcon />
        Bewerken
      </Button>

      <Dialog open={isOpen} onClose={() => setisOpen(false)}>
        <DialogTitle>
          Wijzig boottype {gearType.title ? `van '${gearType.title}'` : ""}
        </DialogTitle>
        <DialogBody>
          <form action={execute}>
            <Fieldset>
              <Field>
                <Label>Naam</Label>
                <Input
                  name="title"
                  defaultValue={getInputValue("title")}
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
