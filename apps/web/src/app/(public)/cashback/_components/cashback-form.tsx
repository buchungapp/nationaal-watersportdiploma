import Balancer from "react-wrap-balancer";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { MediaDropzone } from "~/app/(dashboard)/_components/media-dropzone";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { SubmitButton } from "./cashback-form-client";

export default function CashbackForm() {
  return (
    <section className="flex flex-col items-center gap-8 bg-branding-light px-8 lg:px-16 py-20 rounded-[3rem] w-full">
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-white text-3xl sm:text-4xl text-center">
          Vraag je cashback aan
        </h2>
        <p className="max-w-2xl text-white/80 text-center">
          <Balancer>
            Vul onderstaand formulier in om je cashback aan te vragen. Zorg dat
            je je boekingsbevestiging en een kopie van je X bij de hand hebt.
          </Balancer>
        </p>
      </div>
      <form className="@container/cashback-fields bg-white p-8 rounded-xl w-full max-w-4xl">
        <div className="gap-8 @2xl/cashback-fields:gap-x-4 grid grid-cols-1 @xl/cashback-fields:grid-cols-12">
          <Field className="@2xl/cashback-fields:col-span-4 @xl/cashback-fields:col-span-6">
            <Label>
              Naam <span className="text-branding-orange">*</span>
            </Label>
            <Input name="name" placeholder="Volledige naam" required />
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
            />
          </Field>

          <Field className="@2xl/cashback-fields:col-span-4 @xl/cashback-fields:col-span-6">
            <Label>
              Telefoonnummer <span className="text-branding-orange">*</span>
            </Label>
            <Input name="phone" type="tel" placeholder="06 12345678" required />
          </Field>

          <Field className="@2xl/cashback-fields:col-span-6 @xl/cashback-fields:col-span-6">
            <Label>
              Adres <span className="text-branding-orange">*</span>
            </Label>
            <Input
              name="address"
              placeholder="Straatnaam en huisnummer"
              required
            />
          </Field>

          <Field className="@2xl/cashback-fields:col-span-3 @xl/cashback-fields:col-span-6">
            <Label>
              Postcode <span className="text-branding-orange">*</span>
            </Label>
            <Input name="postalCode" placeholder="1234 AB" required />
          </Field>

          <Field className="@2xl/cashback-fields:col-span-3 @xl/cashback-fields:col-span-6">
            <Label>
              Plaats <span className="text-branding-orange">*</span>
            </Label>
            <Input name="city" placeholder="Plaatsnaam" required />
          </Field>

          <Field className="@2xl/cashback-fields:col-span-4 @xl/cashback-fields:col-span-6">
            <Label>
              IBAN Rekeningnummer{" "}
              <span className="text-branding-orange">*</span>
            </Label>
            <Input name="iban" placeholder="NL12 ABCD 1234 5678 90" required />
          </Field>

          <Field className="@2xl/cashback-fields:col-span-5 @xl/cashback-fields:col-span-6">
            <Label>
              Vaarschool <span className="text-branding-orange">*</span>
            </Label>
            <Input
              name="sailingSchool"
              placeholder="Naam vaarschool"
              required
            />
          </Field>

          <Field className="@2xl/cashback-fields:col-span-3 @xl/cashback-fields:col-span-6">
            <Label>
              Boekingsnummer <span className="text-branding-orange">*</span>
            </Label>
            <Input name="bookingNumber" placeholder="Boekingsnummer" required />
          </Field>

          <Field className="@xl/cashback-fields:col-span-12">
            <Label>
              Upload @TODO <span className="text-branding-orange">*</span>
            </Label>
            <MediaDropzone name="media" />
          </Field>

          <Field className="@xl/cashback-fields:col-span-12">
            <Label>Opmerking</Label>
            <Textarea name="comments" placeholder="Eventuele opmerkingen" />
          </Field>

          <CheckboxField className="@xl/cashback-fields:col-span-12">
            <Label>
              Ik ga akkoord met de voorwaarden{" "}
              <span className="text-branding-orange">*</span>
            </Label>
            <Checkbox name="terms" />
          </CheckboxField>
        </div>

        <div className="flex justify-end mt-8">
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}
