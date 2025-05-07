"use client";

import clsx from "clsx";
import { OTPInput } from "input-otp";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import { type PropsWithChildren, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "~/app/(dashboard)/_components/button";
import { Field } from "~/app/(dashboard)/_components/fieldset";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { loginAction } from "~/app/_actions/auth/login-action";
import { verifyAction } from "~/app/_actions/auth/verify-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";

export function SubmitButton({ children }: PropsWithChildren) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" color="blue" className="w-full" disabled={pending}>
      {pending ? <Spinner className="text-white" /> : children}
    </Button>
  );
}

function loginErrorMessage(
  error: InferUseActionHookReturn<typeof loginAction>["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.validationErrors) {
    return "Ongeldig e-mailadres";
  }

  if (error.bindArgsValidationErrors) {
    return DEFAULT_SERVER_ERROR_MESSAGE;
  }

  return null;
}

export function EmailForm({
  ...formProps
}: Exclude<React.ComponentProps<"form">, "action">) {
  const { execute, result, input } = useAction(loginAction);

  const { getInputValue } = useFormInput(input);

  const errorMessage = loginErrorMessage(result);

  return (
    <form action={execute} {...formProps}>
      <Field>
        <Label>E-mailadres</Label>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={getInputValue("email")}
        />
      </Field>

      <div>
        <SubmitButton>Doorgaan</SubmitButton>

        <p className="mt-2.5 text-slate-400 text-sm text-center">
          We sturen een pincode naar je e-mailadres
        </p>
      </div>

      {errorMessage ? (
        <div className="font-mono text-red-500 text-xs">{errorMessage}</div>
      ) : null}
    </form>
  );
}

function FakeCaret() {
  return (
    <div className="absolute inset-0 flex justify-center items-center animate-caret-blink pointer-events-none">
      <div className="bg-black w-px h-6" />
    </div>
  );
}

function OTPInputWithPending({ children }: PropsWithChildren) {
  const { pending } = useFormStatus();
  return pending ? <Spinner className="text-black" /> : children;
}

function verifyErrorMessage(
  error: InferUseActionHookReturn<typeof verifyAction>["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.validationErrors) {
    return "Ongeldige OTP";
  }

  if (error.bindArgsValidationErrors) {
    return "Ongeldige e-mailadres";
  }

  return null;
}

export function OtpForm({
  email,
  ...formProps
}: { email: string } & Exclude<React.ComponentProps<"form">, "action">) {
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { execute, result } = useAction(verifyAction.bind(null, email));

  const errorMessage = verifyErrorMessage(result);

  return (
    <form ref={formRef} action={execute} {...formProps}>
      <button type="submit" className="hidden" ref={submitButtonRef} />
      <OTPInputWithPending>
        <OTPInput
          maxLength={6}
          autoFocus
          name="otp"
          containerClassName={clsx([
            "group flex justify-between items-center has-disabled:opacity-30",
          ])}
          pushPasswordManagerStrategy="none"
          data-lpignore="true"
          data-1p-ignore="true"
          onComplete={() => {
            const formElement = formRef.current;

            if (!formElement) return; // Safeguard against null reference

            try {
              // Attempt to use requestSubmit if available
              if (typeof formElement.requestSubmit === "function") {
                formElement.requestSubmit();
              } else {
                // Fallback for older browsers
                submitButtonRef.current?.click();
              }
            } catch (error) {
              console.error("Form submission error:", error);
            }
          }}
          render={({ slots }) => (
            <>
              {slots.map(({ char, hasFakeCaret, isActive }, idx) => {
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    key={idx}
                    className={clsx([
                      // Basic layout
                      "h-12 w-12 relative flex items-center justify-center appearance-none rounded-lg px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]",

                      // Typography
                      "text-base/6 text-zinc-950 placeholder:text-zinc-500 dark:text-white",

                      // Border
                      "border border-zinc-950/10 data-hover:border-zinc-950/20 dark:border-white/10 dark:data-hover:border-white/20",

                      // Background color
                      "bg-transparent dark:bg-white/5",

                      // Hide default focus styles
                      "focus:outline-hidden",

                      //   Focus ring
                      isActive && "ring-inset ring-2 ring-blue-500",

                      // Invalid state
                      "data-invalid:border-red-500 data-invalid:data-hover:border-red-500 dark:data-invalid:border-red-500 dark:data-invalid:data-hover:border-red-500",

                      // Disabled state
                      "data-disabled:border-zinc-950/20 dark:data-hover:data-disabled:border-white/15 dark:data-disabled:border-white/15 dark:data-disabled:bg-white/[2.5%]",
                    ])}
                  >
                    {char}
                    {hasFakeCaret && <FakeCaret />}
                  </div>
                );
              })}
            </>
          )}
        />
      </OTPInputWithPending>

      {errorMessage ? (
        <div className="font-mono text-red-500 text-xs">{errorMessage}</div>
      ) : null}
    </form>
  );
}
