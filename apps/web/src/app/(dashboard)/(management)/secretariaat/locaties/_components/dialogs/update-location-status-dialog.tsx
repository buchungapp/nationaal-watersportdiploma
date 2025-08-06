"use client";

import { BookmarkIcon } from "@heroicons/react/16/solid";
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
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateLocationStatusAction } from "~/app/_actions/location/update-location-status-action";
import Spinner from "~/app/_components/spinner";

export function UpdateLocationStatusDialog({
  locationId,
  status,
}: {
  locationId: string;
  status: "draft" | "hidden" | "archived" | "active";
}) {
  const [isOpen, setisOpen] = useState(false);

  const close = () => {
    setisOpen(false);
    reset();
  };

  const { execute, input, reset } = useAction(
    updateLocationStatusAction.bind(null, locationId),
    {
      onSuccess: () => {
        close();
        toast.success("Locatie status bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    status: status,
  });

  return (
    <>
      <Button onClick={() => setisOpen(true)}>
        <BookmarkIcon />
        Status
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Status aanpassen</DialogTitle>
        <DialogBody>
          <form action={execute}>
            <Fieldset>
              <FieldGroup>
                <Field>
                  <Label>Status</Label>
                  <Listbox name="status" defaultValue={getInputValue("status")}>
                    <ListboxOption value="draft">Concept</ListboxOption>
                    <ListboxOption value="hidden">Verborgen</ListboxOption>
                    <ListboxOption value="archived">Gearchiveerd</ListboxOption>
                    <ListboxOption value="active">Actief</ListboxOption>
                  </Listbox>
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
