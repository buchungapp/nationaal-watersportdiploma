"use client";

import { LightBulbIcon } from "@heroicons/react/16/solid";
import { usePathname, useSearchParams } from "next/navigation";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import {
  createContext,
  type PropsWithChildren,
  Suspense,
  useContext,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  ErrorMessage,
  Field,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { productFeedbackAction } from "../../../_actions/send-feedback-action";
import { DropdownItem, DropdownLabel } from "../../_components/dropdown";

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

export function productFeedbackErrorMessage(
  error: InferUseActionHookReturn<typeof productFeedbackAction>["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.validationErrors) {
    return "Een van de velden is niet correct ingevuld.";
  }

  return null;
}

function Feedback() {
  const { isOpen, setIsOpen } = useFeedbackDialog();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { execute, result, input, reset } = useAction(productFeedbackAction, {
    onSuccess: () => {
      closeDialog();
      toast.success("We hebben je feedback ontvangen! 🎉");
    },
  });

  const closeDialog = () => {
    setIsOpen(false);
    reset();
  };

  const { getInputValue } = useFormInput(input);

  const errorMessage = productFeedbackErrorMessage(result);

  const label = "Hoe maken we de applicatie beter?";
  const placeholder = "Het zou super zijn als...";

  return (
    <Dialog open={isOpen} onClose={closeDialog}>
      <DialogTitle>Neem contact op</DialogTitle>

      <form
        action={(formData) =>
          execute({
            type: "product-feedback",
            priority: "normal",
            message: formData.get("comment") as string,
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
          </Fieldset>

          {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={closeDialog}>
            Sluiten
          </Button>
          <SubmitButton />
        </DialogActions>
      </form>
    </Dialog>
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
