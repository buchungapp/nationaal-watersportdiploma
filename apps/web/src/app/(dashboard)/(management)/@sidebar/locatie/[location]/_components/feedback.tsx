"use client";

import { ChatBubbleOvalLeftIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import {
  SidebarItem,
  SidebarLabel,
} from "~/app/(dashboard)/_components/sidebar";

import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";

import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";

import {
  Description,
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";

import { Button } from "~/app/(dashboard)/_components/button";
import {
  Radio,
  RadioField,
  RadioGroup,
} from "~/app/(dashboard)/_components/radio";
import { Textarea } from "~/app/(dashboard)/_components/textarea";

import { useFormState as useActionState, useFormStatus } from "react-dom";

export function Feedback() {
  // TODO: Rewrite this part
  const submit = async (prevState: unknown, formData: FormData) => {
    // const result = await createPerson(locationId, prevState, formData);
    // if (result.message === "Success") {
    //   setIsOpen(false);
    //   toast.success("Persoon is toegevoegd.");
    // }
    // return result;
  };

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [state, formAction] = useActionState(submit, undefined);

  return (
    <>
      <SidebarItem onClick={() => setIsOpen(true)}>
        <ChatBubbleOvalLeftIcon />
        <SidebarLabel>Melding doen</SidebarLabel>
      </SidebarItem>

      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Help mij</DialogTitle>
        <DialogDescription>Er zijn geen stomme vragen.</DialogDescription>
        <form action={formAction}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                {/* TODO: first iteration fields (use tabs) */}
                <RadioGroup name="resale" defaultValue="permit">
                  <RadioField>
                    <Radio value="bug" />
                    <Label>Bug</Label>
                  </RadioField>
                  <RadioField>
                    <Radio value="feedback" />
                    <Label>Feedback</Label>
                  </RadioField>
                  <RadioField>
                    <Radio value="question" />
                    <Label>Question</Label>
                  </RadioField>
                </RadioGroup>

                <Field>
                  <Label>Opmerking</Label>
                  <Textarea name="comment" required />
                </Field>

                <CheckboxGroup>
                  <CheckboxField>
                    <Checkbox name="urgent" />
                    <Label>Dit is dringend</Label>
                    <Description>
                      Vink aan als dit als de bug voorkomt dat je Plain kunt
                      gebruiken.
                    </Description>
                  </CheckboxField>
                </CheckboxGroup>
              </FieldGroup>
            </Fieldset>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Sluiten
            </Button>
            <SubmitButton />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      Verzenden
    </Button>
  );
}
