"use client";

import { PlusIcon } from "@heroicons/react/16/solid";
import slugify from "@sindresorhus/slugify";
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
import { Text } from "~/app/(dashboard)/_components/text";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { createLocationAction } from "~/app/_actions/location/create-location-action";
import Spinner from "~/app/_components/spinner";

export function CreateLocationDialog() {
  const [isOpen, setisOpen] = useState(false);

  const close = () => {
    setisOpen(false);
    reset();
  };

  const { execute, input, reset } = useAction(createLocationAction, {
    onSuccess: () => {
      close();
      toast.success("Locatie aangemaakt");
    },
    onError: () => {
      toast.error("Er is iets misgegaan");
    },
  });

  const { getInputValue } = useFormInput(input);
  const [slug, setSlug] = useState("");

  return (
    <>
      <Button color="branding-orange" onClick={() => setisOpen(true)}>
        <PlusIcon />
        Nieuwe locatie
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Nieuwe locatie</DialogTitle>
        <DialogBody>
          <form action={execute}>
            <Fieldset>
              <FieldGroup>
                <Field>
                  <Label>Naam</Label>
                  <Input
                    name="name"
                    defaultValue={getInputValue("name")}
                    required
                    onChange={(e) => {
                      setSlug(slugify(e.target.value));
                    }}
                  />
                </Field>
                <Field>
                  <Label>Slug</Label>
                  <Text className="text-sm">
                    {slug.length > 0
                      ? slug
                      : "Slug wordt automatisch aangemaakt"}
                  </Text>
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
      Aanmaken
    </Button>
  );
}
