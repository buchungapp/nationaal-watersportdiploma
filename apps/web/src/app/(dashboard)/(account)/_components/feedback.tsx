"use client";

import { Suspense, createContext, useActionState, useContext, useState, type PropsWithChildren } from "react";

import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";

import { toast } from "sonner";
import {
  ErrorMessage,
  Field,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";

import { Button } from "~/app/(dashboard)/_components/button";
import { Textarea } from "~/app/(dashboard)/_components/textarea";

import { LightBulbIcon } from "@heroicons/react/16/solid";
import { usePathname, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { z } from "zod";
import Spinner from "~/app/_components/spinner";
import { productFeedbackAction } from "../../_actions/feedback";
import { DropdownItem, DropdownLabel } from "../../_components/dropdown";

function urlSearchParamsToObject(
  urlSearchParams: URLSearchParams,
): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {};

  urlSearchParams.forEach((value, key) => {
    if (obj.hasOwnProperty(key)) {
      const currentValue = obj[key]!;
      if (Array.isArray(currentValue)) {
        currentValue.push(value);
      } else {
        obj[key] = [currentValue, value];
      }
    } else {
      obj[key] = value;
    }
  });

  return obj;
}

interface FeedbackContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const FeedbackContext = createContext<FeedbackContextValue>(
  {} as FeedbackContextValue,
);

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <FeedbackContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </FeedbackContext.Provider>
  );
}

function useFeedbackDialog() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }

  return context;
}

function Feedback() {
  const { isOpen, setIsOpen } = useFeedbackDialog();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const submitFeedback = async (_prevState: unknown, formData: FormData) => {
    try {
      const schema = z.object({
        comment: z.string(),
        urgent: z.boolean().optional(),
      });

      const { comment } = schema.parse({
        comment: formData.get("comment") as string,
      });

      await productFeedbackAction({
        type: "product-feedback",
        priority: "normal",
        message: comment,
        path: pathname,
        query: urlSearchParamsToObject(searchParams),
        headers: {
          "user-agent": navigator.userAgent,
        },
      });

      setIsOpen(false);
      toast.success("We hebben je feedback ontvangen! 🎉");
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

  const label = "Hoe maken we de applicatie beter?";
  const placeholder = "Het zou super zijn als...";

  return (
    <>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Neem contact op</DialogTitle>

        <form action={formAction}>
          <DialogBody>
            <Fieldset>
              <Field>
                <Label>{label}</Label>
                <Textarea name="comment" required placeholder={placeholder} />
              </Field>
            </Fieldset>

            {!!state?.error && <ErrorMessage>{state.error}</ErrorMessage>}
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
      {pending ? <Spinner className="text-white" /> : null}
      Verzenden
    </Button>
  );
}

export function FeedbackButton() {
  const { setIsOpen } = useFeedbackDialog();

  return (
    <DropdownItem onClick={() => setIsOpen(true)}>
      <LightBulbIcon />
      <DropdownLabel>Feedback delen</DropdownLabel>
    </DropdownItem>
  );
}

export default function FeedbackDialog() {
  return (
    <Suspense fallback={null}>
      <Feedback />
    </Suspense>
  );
}
