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

import { toast } from "sonner";
import {
  Description,
  Field,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";

import { Tab, TabGroup, TabList } from "@tremor/react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Textarea } from "~/app/(dashboard)/_components/textarea";

import { useFormState as useActionState, useFormStatus } from "react-dom";

const mockSubmitFeedback = (prevState: unknown, formData: FormData) => {
  console.log("✅ prevState", prevState);
  console.log("✅ formData", formData);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: "Success" });
    }, 1500);
  });
};

export function Feedback() {
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await mockSubmitFeedback(prevState, formData);
    if (result?.message === "Success") {
      setIsOpen(false);
      toast.success("Dank! Jouw feedback is ontvangen! 🎉");
    }
    return result;
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
        <DialogDescription>
          Kies het type vraag je wilt stellen.
        </DialogDescription>
        <form action={formAction}>
          <DialogBody>
            <Fieldset>
              <TabGroup className="mb-6">
                <TabList variant="solid" defaultValue="bug">
                  <Tab value="bug">Bug</Tab>
                  <Tab value="feedback">Feedback</Tab>
                  <Tab value="question">Vraag</Tab>
                </TabList>
              </TabGroup>

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
