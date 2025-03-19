"use client";

import { useActionState } from "react";
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
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import Spinner from "~/app/_components/spinner";
import type { listAllLocations } from "~/lib/nwd";
import { createCashbackAction } from "../_actions/cashback";

export function CashbackFormClient({
  locations,
}: {
  locations: Awaited<ReturnType<typeof listAllLocations>>;
}) {
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await createCashbackAction(prevState, formData);

    if (result.message === "Success") {
      toast.success("Cashback aangevraagd.");
    }

    return result;
  };

  const [state, action] = useActionState(submit, undefined);
  console.log("Form state:", state);

  return (
    <form
      action={action}
      className="@container/cashback-fields bg-white p-4 lg:p-8 rounded-xl w-full max-w-5xl"
    >
      <div className="gap-8 grid grid-cols-1">
        <Fieldset>
          <Legend>Persoonlijke gegevens</Legend>
          <div className="gap-8 @2xl/cashback-fields:gap-x-4 grid grid-cols-1 @xl/cashback-fields:grid-cols-12">
            <Field className="@2xl/cashback-fields:col-span-4 @xl/cashback-fields:col-span-6">
              <Label>
                Naam <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="fullName"
                placeholder="Volledige naam"
                required
                invalid={!!state?.errors?.fullName}
                defaultValue={state?.fields?.fullName as string}
              />
              {state?.errors?.fullName ? (
                <ErrorMessage>{state.errors.fullName}</ErrorMessage>
              ) : null}
            </Field>

            <Field className="@2xl/cashback-fields:col-span-4 @xl/cashback-fields:col-span-6">
              <Label>
                E-mail <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="email"
                type="email"
                placeholder="naam@voorbeeld.nl"
                required
                invalid={!!state?.errors?.email}
                defaultValue={state?.fields?.email as string}
              />
              {state?.errors?.email ? (
                <ErrorMessage>{state.errors.email}</ErrorMessage>
              ) : null}
            </Field>

            <Field className="@2xl/cashback-fields:col-span-4 @xl/cashback-fields:col-span-6">
              <Label>
                Telefoonnummer <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="phone"
                type="tel"
                placeholder="06 12345678"
                required
                invalid={!!state?.errors?.phone}
                defaultValue={state?.fields?.phone as string}
              />
              {state?.errors?.phone ? (
                <ErrorMessage>{state.errors.phone}</ErrorMessage>
              ) : null}
            </Field>

            <Field className="@2xl/cashback-fields:col-span-6 @xl/cashback-fields:col-span-6">
              <Label>
                Adres <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="address"
                placeholder="Straatnaam en huisnummer"
                required
                invalid={!!state?.errors?.address}
                defaultValue={state?.fields?.address as string}
              />
              {state?.errors?.address ? (
                <ErrorMessage>{state.errors.address}</ErrorMessage>
              ) : null}
            </Field>

            <Field className="@2xl/cashback-fields:col-span-3 @xl/cashback-fields:col-span-6">
              <Label>
                Postcode <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="postalCode"
                placeholder="1234 AB"
                required
                invalid={!!state?.errors?.postalCode}
                defaultValue={state?.fields?.postalCode as string}
              />
              {state?.errors?.postalCode ? (
                <ErrorMessage>{state.errors.postalCode}</ErrorMessage>
              ) : null}
            </Field>

            <Field className="@2xl/cashback-fields:col-span-3 @xl/cashback-fields:col-span-6">
              <Label>
                Plaats <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="city"
                placeholder="Plaatsnaam"
                required
                invalid={!!state?.errors?.city}
                defaultValue={state?.fields?.city as string}
              />
              {state?.errors?.city ? (
                <ErrorMessage>{state.errors.city}</ErrorMessage>
              ) : null}
            </Field>
          </div>
        </Fieldset>
        <Fieldset>
          <Legend>X cursus 2024</Legend>
          <div className="gap-8 @2xl/cashback-fields:gap-x-4 grid grid-cols-1 @xl/cashback-fields:grid-cols-12">
            <Field className="@2xl/cashback-fields:col-span-5 @xl/cashback-fields:col-span-6">
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

            <Field className="@xl/cashback-fields:col-span-12">
              <Label>
                Upload @TODO <span className="text-branding-orange">*</span>
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
          <div className="gap-8 @2xl/cashback-fields:gap-x-4 grid grid-cols-1 @xl/cashback-fields:grid-cols-12">
            <Field className="@2xl/cashback-fields:col-span-5 @xl/cashback-fields:col-span-6">
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

            <Field className="@2xl/cashback-fields:col-span-3 @xl/cashback-fields:col-span-6">
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
          <div className="gap-8 @2xl/cashback-fields:gap-x-4 grid grid-cols-1 @xl/cashback-fields:grid-cols-12">
            <Field className="@xl/cashback-fields:col-span-6">
              <Label>
                IBAN Rekeningnummer{" "}
                <span className="text-branding-orange">*</span>
              </Label>
              <Input
                name="iban"
                placeholder="NL12 ABCD 1234 5678 90"
                required
                invalid={!!state?.errors?.iban}
                defaultValue={state?.fields?.iban as string}
              />
              {state?.errors?.iban ? (
                <ErrorMessage>{state.errors.iban}</ErrorMessage>
              ) : null}
            </Field>

            <Field className="@xl/cashback-fields:col-span-12">
              <Label>Opmerking</Label>
              <Textarea
                name="comments"
                placeholder="Eventuele opmerkingen"
                invalid={!!state?.errors?.comments}
                defaultValue={state?.fields?.comments as string}
              />
              {state?.errors?.comments ? (
                <ErrorMessage>{state.errors.comments}</ErrorMessage>
              ) : null}
            </Field>

            <CheckboxField className="@xl/cashback-fields:col-span-12">
              <Label>
                Ik ga akkoord met de voorwaarden{" "}
                <span className="text-branding-orange">*</span>
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
            <CheckboxField className="@xl/cashback-fields:col-span-12">
              <Label>
                Ik wil me graag inschrijven voor de nieuwsbrief van NWD
              </Label>
              <Checkbox
                name="newsletter"
                defaultChecked={
                  state?.fields?.newsletter
                    ? state?.fields?.newsletter === "on"
                    : true
                }
                key={state?.fields?.newsletter as string} // Checkbox do not allow defaultValue so reset field by changing key
              />
              {state?.errors?.newsletter ? (
                <ErrorMessage>{state.errors.newsletter}</ErrorMessage>
              ) : null}
            </CheckboxField>
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
