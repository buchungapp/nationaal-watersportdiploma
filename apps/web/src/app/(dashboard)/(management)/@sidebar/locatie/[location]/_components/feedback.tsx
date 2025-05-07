"use client";

import { ChatBubbleOvalLeftIcon } from "@heroicons/react/20/solid";
import { Suspense, useState } from "react";
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
import { useAction } from "next-safe-action/hooks";
import { usePathname, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { productFeedbackErrorMessage } from "~/app/(dashboard)/(account)/_components/feedback";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { productFeedbackAction } from "~/app/_actions/send-feedback-action";
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

  const { execute, result, input } = useAction(productFeedbackAction, {
    onSuccess: () => {
      close();
      toast.success("We hebben je melding ontvangen! 🎉");
    },
  });

  const { getInputValue } = useFormInput(input);

  const errorMessage = productFeedbackErrorMessage(result);

  const label = feedbackLabels[type].label;
  const placeholder = feedbackLabels[type].placeholder;

  return (
    <TabPanel>
      <form
        action={(formData) =>
          execute({
            type: type === "feedback" ? "product-feedback" : type,
            message: formData.get("comment") as string,
            priority: formData.get("urgent") === "on" ? "high" : "normal",
            path: pathname,
            query: urlSearchParamsToObject(searchParams),
            headers: {
              "user-agent": navigator.userAgent,
            },
          })
        }
      >
        <DialogBody>
          <Fieldset>
            <Field>
              <Label>{label}</Label>
              <Textarea
                name="comment"
                required
                placeholder={placeholder}
                defaultValue={getInputValue("message")}
              />
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

          {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}
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
          <TabList className="grid grid-cols-3 bg-slate-100 p-[2px] border border-slate-300 rounded-lg w-full">
            <Tab className="flex justify-center items-center gap-x-2 data-selected:bg-white opacity-50 data-selected:opacity-100 data-selected:shadow-sm p-2 rounded-md text-slate-900 text-xs">
              <BugAntIcon className="size-4 text-slate-400" />
              Bug
            </Tab>
            <Tab className="flex justify-center items-center gap-x-2 data-selected:bg-white opacity-50 data-selected:opacity-100 data-selected:shadow-sm p-2 rounded-md text-slate-900 text-xs">
              <ChatBubbleOvalLeftIconSm className="size-4 text-slate-400" />
              Feedback
            </Tab>
            <Tab className="flex justify-center items-center gap-x-2 data-selected:bg-white opacity-50 data-selected:opacity-100 data-selected:shadow-sm p-2 rounded-md text-slate-900 text-xs">
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
