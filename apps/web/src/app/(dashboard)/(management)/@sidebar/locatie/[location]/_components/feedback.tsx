"use client";

import { ChatBubbleOvalLeftIcon } from "@heroicons/react/20/solid";
import { Suspense, useActionState, useState } from "react";
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
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";

import { toast } from "sonner";
import {
  Description,
  ErrorMessage,
  Field,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Textarea } from "~/app/(dashboard)/_components/textarea";

import {
  BugAntIcon,
  ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconSm,
  QuestionMarkCircleIcon,
} from "@heroicons/react/16/solid";
import { usePathname, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { z } from "zod";
import { productFeedbackAction } from "~/app/(dashboard)/_actions/feedback";
import Spinner from "~/app/_components/spinner";

const feedbackLabels = {
  bug: {
    label: "Wat heb je gevonden?",
    placeholder: "Als ik... dan...",
  },
  feedback: {
    label: "Hoe maken we de applicatie beter?",
    placeholder: "Het zou super zijn als...",
  },
  question: {
    label: "Hoe kunnen we helpen?",
    placeholder: "Kunnen jullie...",
  },
} as const;

function urlSearchParamsToObject(
  urlSearchParams: URLSearchParams,
): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {};

  urlSearchParams.forEach((value, key) => {
    if (Object.hasOwn(obj, key)) {
      const currentValue = obj[key];
      if (Array.isArray(currentValue)) {
        currentValue.push(value);
      } else if (typeof currentValue !== "undefined") {
        obj[key] = [currentValue, value];
      }
    } else {
      obj[key] = value;
    }
  });

  return obj;
}

function FeedbackTab({
  close,
  type,
}: {
  close: () => void;
  type: "bug" | "feedback" | "question";
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const submitFeedback = async (_prevState: unknown, formData: FormData) => {
    try {
      const schema = z.object({
        comment: z.string(),
        urgent: z.boolean().optional(),
      });

      const { comment, urgent } = schema.parse({
        comment: formData.get("comment") as string,
        urgent: formData.get("urgent") === "on",
      });

      await productFeedbackAction({
        type: type === "feedback" ? "product-feedback" : type,
        priority: urgent ? "high" : "normal",
        message: comment,
        path: pathname,
        query: urlSearchParamsToObject(searchParams),
        headers: {
          "user-agent": navigator.userAgent,
        },
      });

      close();
      toast.success("We hebben je melding ontvangen! 🎉");
    } catch (error) {
      if (error instanceof Error) {
        return {
          error: error.message,
        };
      }
      return { error: "Er is iets misgegaan. Probeer het later opnieuw." };
    }
  };

  const [state, formAction] = useActionState(submitFeedback, undefined);

  const label = feedbackLabels[type].label;
  const placeholder = feedbackLabels[type].placeholder;

  return (
    <TabPanel>
      <form action={formAction}>
        <DialogBody>
          <Fieldset>
            <Field>
              <Label>{label}</Label>
              <Textarea name="comment" required placeholder={placeholder} />
            </Field>
            {type === "bug" && (
              <CheckboxGroup>
                <CheckboxField>
                  <Checkbox name="urgent" />
                  <Label>Dit is dringend</Label>
                  <Description>
                    Vink dit vak aan als deze bug voorkomt dat je verder kunt.
                  </Description>
                </CheckboxField>
              </CheckboxGroup>
            )}
          </Fieldset>

          {!!state?.error && <ErrorMessage>{state.error}</ErrorMessage>}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={close}>
            Sluiten
          </Button>
          <SubmitButton />
        </DialogActions>
      </form>
    </TabPanel>
  );
}

function Feedback() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <SidebarItem onClick={() => setIsOpen(true)}>
        <ChatBubbleOvalLeftIcon />
        <SidebarLabel>Feedback geven</SidebarLabel>
      </SidebarItem>

      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Neem contact op</DialogTitle>

        <TabGroup className="mt-4">
          <TabList className="bg-slate-100 border border-slate-300 rounded-lg w-full grid grid-cols-3 p-[2px]">
            <Tab className="p-2 data-selected:bg-white flex items-center text-slate-900 gap-x-2 data-selected:opacity-100 opacity-50 justify-center rounded-md text-xs data-selected:shadow-sm">
              <BugAntIcon className="size-4 text-slate-400" />
              Bug
            </Tab>
            <Tab className="p-2 data-selected:bg-white flex items-center text-slate-900 gap-x-2 data-selected:opacity-100 opacity-50 justify-center rounded-md text-xs data-selected:shadow-sm">
              <ChatBubbleOvalLeftIconSm className="size-4 text-slate-400" />
              Feedback
            </Tab>
            <Tab className="p-2 data-selected:bg-white flex items-center text-slate-900 gap-x-2 data-selected:opacity-100 opacity-50 justify-center rounded-md text-xs data-selected:shadow-sm">
              <QuestionMarkCircleIcon className="size-4 text-slate-400" />
              Vraag
            </Tab>
          </TabList>
          <TabPanels className="mt-6">
            <FeedbackTab close={() => setIsOpen(false)} type="bug" />
            <FeedbackTab close={() => setIsOpen(false)} type="feedback" />
            <FeedbackTab close={() => setIsOpen(false)} type="question" />
          </TabPanels>
        </TabGroup>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Verzenden
    </Button>
  );
}

export default function () {
  return (
    <Suspense
      fallback={
        <SidebarItem>
          <ChatBubbleOvalLeftIcon />
          <SidebarLabel>Feedback geven</SidebarLabel>
        </SidebarItem>
      }
    >
      <Feedback />
    </Suspense>
  );
}
