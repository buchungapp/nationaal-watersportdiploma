"use client";

import clsx from "clsx";
import { OTPInput } from "input-otp";
import { type PropsWithChildren, useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "~/app/(dashboard)/_components/button";
import { login, verify } from "~/app/_actions/auth";
import Spinner from "~/app/_components/spinner";

export function SubmitButton({ children }: PropsWithChildren) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" color="blue" className="w-full" disabled={pending}>
      {pending ? <Spinner className="text-white" /> : children}
    </Button>
  );
}

export function EmailForm({
  children,
  ...formProps
}: PropsWithChildren<Exclude<React.ComponentProps<"form">, "action">>) {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <form action={formAction} {...formProps}>
      {children}

      {state?.error ? (
        <div className="text-red-500 text-xs font-mono">{state.error}</div>
      ) : null}
    </form>
  );
}

function FakeCaret() {
  return (
    <div className="absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink">
      <div className="w-px h-6 bg-black" />
    </div>
  );
}

function OTPInputWithPending({ children }: PropsWithChildren) {
  const { pending } = useFormStatus();
  return pending ? <Spinner className="text-black" /> : children;
}

export function OtpForm({
  email,
  ...formProps
}: { email: string } & Exclude<React.ComponentProps<"form">, "action">) {
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    verify.bind(null, email),
    undefined,
  );

  return (
    <form ref={formRef} action={formAction} {...formProps}>
      <button type="submit" className="hidden" ref={submitButtonRef} />
      <OTPInputWithPending>
        <OTPInput
          maxLength={6}
          autoFocus
          name="otp"
          containerClassName={clsx([
            "group flex justify-between items-center has-[:disabled]:opacity-30",
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
                      "h-12 w-12 relative flex items-center justify-center appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]",

                      // Typography
                      "text-base/6 text-zinc-950 placeholder:text-zinc-500 dark:text-white",

                      // Border
                      "border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20",

                      // Background color
                      "bg-transparent dark:bg-white/5",

                      // Hide default focus styles
                      "focus:outline-none",

                      //   Focus ring
                      isActive && "ring-inset ring-2 ring-blue-500",

                      // Invalid state
                      "data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-500 data-[invalid]:data-[hover]:dark:border-red-500",

                      // Disabled state
                      "data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15 data-[disabled]:dark:bg-white/[2.5%]",
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

      {state?.error ? (
        <div className="text-red-500 text-xs font-mono">{state.error}</div>
      ) : null}
    </form>
  );
}
