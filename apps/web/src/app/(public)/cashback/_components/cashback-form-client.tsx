"use client";

import JSConfetti from "js-confetti";
import Link from "next/link";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import {
  Description,
  ErrorMessage,
  Field,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import { MediaDropzone } from "~/app/(dashboard)/_components/media-dropzone";
import Spinner from "~/app/_components/spinner";
import type { listAllLocations } from "~/lib/nwd";
import { createCashbackAction } from "../_actions/cashback";

export function CashbackFormClient({
  locations,
}: {
  locations: Awaited<ReturnType<typeof listAllLocations>>;
}) {
  const [isSuccess, setIsSuccess] = useState(false);

  const confettiClient = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return new JSConfetti();
  }, []);

  const showConfetti = useCallback(() => {
    if (!confettiClient) {
      console.info("Confetti client not initialized");
      return;
    }

    void confettiClient.addConfetti({
      confettiColors: ["#ff8000", "#007FFF", "#0047ab"],
      confettiRadius: 6,
      confettiNumber: 500,
    });
  }, [confettiClient]);

  useEffect(() => {
    if (isSuccess) {
      showConfetti();
    }
  }, [isSuccess, showConfetti]);

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await createCashbackAction(prevState, formData);

    if (result.message === "Success") {
      toast.success("Cashback aangevraagd.");
      setIsSuccess(true);
    }

    return result;
  };

  const [state, action] = useActionState(submit, undefined);

  if (isSuccess) {
    return (
      <div className="bg-white p-4 lg:p-8 rounded-xl w-full max-w-3xl text-center min-h-[600px] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Gelukt!</h2>
        <p className="text-slate-600 mb-8 max-w-prose mx-auto">
          We hebben je cashback aanvraag ontvangen. <br /> Als we vragen hebben
          nemen we contact met je op.
        </p>
        <Button color="branding-dark" onClick={() => setIsSuccess(false)}>
          Nieuwe aanvraag indienen
        </Button>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="@container/cashback-fields bg-white p-4 lg:p-8 rounded-xl w-full max-w-3xl"
    >
      <div className="gap-8 grid grid-cols-1">
        <Fieldset>
          <Legend>Gegevens aanvrager</Legend>
          <div className="gap-8 grid grid-cols-1 @xl/cashback-fields:grid-cols-4">
            <Field className="@2xl/cashback-fields:col-span-2">
              <Label>
                Naam <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="applicantFullName"
                placeholder="Volledige naam"
                required
                invalid={!!state?.errors?.applicantFullName}
                defaultValue={state?.fields?.applicantFullName as string}
              />
              {state?.errors?.applicantFullName ? (
                <ErrorMessage>{state.errors.applicantFullName}</ErrorMessage>
              ) : null}
            </Field>

            <Field className="@2xl/cashback-fields:col-span-2">
              <Label>
                E-mail <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="applicantEmail"
                type="email"
                placeholder="naam@voorbeeld.nl"
                required
                invalid={!!state?.errors?.applicantEmail}
                defaultValue={state?.fields?.applicantEmail as string}
              />
              {state?.errors?.applicantEmail ? (
                <ErrorMessage>{state.errors.applicantEmail}</ErrorMessage>
              ) : null}
            </Field>
          </div>
        </Fieldset>
        <Fieldset>
          <Legend>CWO cursus 2024</Legend>
          <div className="gap-8 grid grid-cols-1 @xl/cashback-fields:grid-cols-4">
            <Field className="@2xl/cashback-fields:col-span-2">
              <Label>
                Naam deelnemer op certificaat{" "}
                <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="studentFullName"
                placeholder="Volledige naam"
                required
                invalid={!!state?.errors?.studentFullName}
                defaultValue={state?.fields?.studentFullName as string}
              />
              {state?.errors?.studentFullName ? (
                <ErrorMessage>{state.errors.studentFullName}</ErrorMessage>
              ) : null}
            </Field>
            <Field className="@2xl/cashback-fields:col-span-2">
              <Label>
                Vaarlocatie behaald{" "}
                <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="verificationLocation"
                placeholder="Naam vaarlocatie"
                required
                invalid={!!state?.errors?.verificationLocation}
                defaultValue={state?.fields?.verificationLocation as string}
              />
              {state?.errors?.verificationLocation ? (
                <ErrorMessage>{state.errors.verificationLocation}</ErrorMessage>
              ) : null}
            </Field>

            <Field className="@xl/cashback-fields:col-span-4">
              <Label>
                Upload CWO certificaat{" "}
                <span className="text-branding-orange">*</span>
              </Label>
              <MediaDropzone
                name="verificationMedia"
                required
                invalid={!!state?.errors?.verificationMedia}
                key={state?.fields?.verificationMedia as string} // File input do not allow defaultValue so reset field by changing key
              />
              {state?.errors?.verificationMedia ? (
                <ErrorMessage>{state.errors.verificationMedia}</ErrorMessage>
              ) : null}
            </Field>
          </div>
        </Fieldset>
        <Fieldset>
          <Legend>Geboekte cursus bij NWD vaarlocatie</Legend>
          <div className="gap-8 grid grid-cols-1 @xl/cashback-fields:grid-cols-4">
            <Field className="@2xl/cashback-fields:col-span-2">
              <Label>
                Vaarlocatie <span className="text-branding-orange">*</span>
              </Label>
              <Listbox
                name="bookingLocationId"
                className="w-full"
                invalid={!!state?.errors?.bookingLocationId}
                defaultValue={state?.fields?.bookingLocationId as string}
              >
                {locations.map((location) => (
                  <ListboxOption key={location.id} value={location.id}>
                    {location.name}
                  </ListboxOption>
                ))}
              </Listbox>
              {state?.errors?.bookingLocationId ? (
                <ErrorMessage>{state.errors.bookingLocationId}</ErrorMessage>
              ) : null}
            </Field>

            <Field>
              <Label>
                Boekingsnummer <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="bookingNumber"
                placeholder="Boekingsnummer"
                required
                invalid={!!state?.errors?.bookingNumber}
                defaultValue={state?.fields?.bookingNumber as string}
              />
              {state?.errors?.bookingNumber ? (
                <ErrorMessage>{state.errors.bookingNumber}</ErrorMessage>
              ) : null}
            </Field>
          </div>
        </Fieldset>
        <Fieldset>
          <Legend>Bank gegevens</Legend>
          <div className="gap-8 grid grid-cols-1 @xl/cashback-fields:grid-cols-4">
            <Field className="@2xl/cashback-fields:col-span-2">
              <Label>
                IBAN Rekeningnummer{" "}
                <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="applicantIban"
                placeholder="NL12 ABCD 1234 5678 90"
                required
                pattern="^(?:IT|SM)\d{2}[A-Z]\d{3}(?:\d{4}){4}\d{3}|CY\d{2}[A-Z]\d{3}(?:\d{4}){5}|NL\d{2}[A-Z]{4}(?:\d{4}){2}\d{2}|LV\d{2}[A-Z]{4}(?:\d{4}){3}\d|(?:BG|BH|GB|IE)\d{2}[A-Z]{4}(?:\d{4}){3}\d{2}|GI\d{2}[A-Z]{4}(?:\d{4}){3}\d{3}|RO\d{2}[A-Z]{4}(?:\d{4}){4}|KW\d{2}[A-Z]{4}(?:\d{4}){5}\d{2}|MT\d{2}[A-Z]{4}(?:\d{4}){5}\d{3}|NO\d{2}(?:\d{4}){4}|(?:DK|FI|GL|FO)\d{2}(?:\d{4}){3}\d{2}|MK\d{2}(?:\d{4}){3}\d{3}|(?:AT|EE|KZ|LU|XK)\d{2}(?:\d{4}){4}|(?:BA|HR|LI|CH|CR)\d{2}(?:\d{4}){4}\d|(?:GE|DE|LT|ME|RS)\d{2}(?:\d{4}){4}\d{2}|IL\d{2}(?:\d{4}){4}\d{3}|(?:AD|CZ|ES|MD|SA)\d{2}(?:\d{4}){5}|PT\d{2}(?:\d{4}){5}\d|(?:BE|IS)\d{2}(?:\d{4}){5}\d{2}|(?:FR|MR|MC)\d{2}(?:\d{4}){5}\d{3}|(?:AL|DO|LB|PL)\d{2}(?:\d{4}){6}|(?:AZ|HU)\d{2}(?:\d{4}){6}\d|(?:GR|MU)\d{2}(?:\d{4}){6}\d{2}$"
                invalid={!!state?.errors?.applicantIban}
                defaultValue={state?.fields?.applicantIban as string}
              />
              {state?.errors?.applicantIban ? (
                <ErrorMessage>{state.errors.applicantIban}</ErrorMessage>
              ) : null}
            </Field>

            <div className="@xl/cashback-fields:col-span-4 flex flex-col gap-y-2">
              <CheckboxField>
                <Label>
                  Ik ga akkoord met de{" "}
                  <Link
                    href="/cashback/voorwaarden"
                    target="_blank"
                    className="text-branding-orange"
                    onClick={(e) => e.stopPropagation()}
                  >
                    actievoorwaarden
                  </Link>
                  .
                </Label>
                <Checkbox
                  name="terms"
                  defaultChecked={
                    state?.fields?.terms ? state?.fields?.terms === "on" : false
                  }
                  key={state?.fields?.terms as string} // Checkbox do not allow defaultValue so reset field by changing key
                  invalid={!!state?.errors?.terms}
                />
                <Description>
                  {state?.errors?.terms ? (
                    <ErrorMessage>{state.errors.terms}</ErrorMessage>
                  ) : null}
                </Description>
              </CheckboxField>
              <CheckboxField>
                <Label>
                  Ik schrijf me in voor de nieuwsbrief van het Nationaal
                  Watersportdiploma.
                </Label>
                <Checkbox
                  name="newsletter"
                  defaultChecked={
                    state?.fields?.newsletter
                      ? state?.fields?.newsletter === "on"
                      : false
                  }
                  key={state?.fields?.newsletter as string} // Checkbox do not allow defaultValue so reset field by changing key
                />
                {state?.errors?.newsletter ? (
                  <ErrorMessage>{state.errors.newsletter}</ErrorMessage>
                ) : null}
              </CheckboxField>
            </div>
          </div>
        </Fieldset>
      </div>

      <div className="flex justify-end mt-8">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton({ invalid }: { invalid?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending || invalid} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Aanvragen
    </Button>
  );
}
