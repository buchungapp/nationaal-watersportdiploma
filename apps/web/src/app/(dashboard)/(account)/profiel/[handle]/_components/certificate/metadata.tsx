import {
  Field,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { SmartDatePicker } from "~/app/(dashboard)/_components/natural-language-input";
import { Textarea } from "~/app/(dashboard)/_components/textarea";

export function Metadata({
  stepIndex,
  errors,
  defaultValues,
}: {
  stepIndex: number;
  errors?: Record<string, string>;
  defaultValues?: Record<string, string | null | undefined>;
}) {
  return (
    <Fieldset>
      <Legend className="mb-3">
        {stepIndex}. Vul de details over dit diploma in
      </Legend>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-4 sm:gap-4">
        <Field className="sm:col-span-4 relative">
          <Label>
            Titel <span className="text-branding-orange">*</span>
          </Label>
          <Input
            name="title"
            required
            placeholder="bv. Vaarbewijs I"
            defaultValue={defaultValues?.title ?? undefined}
            invalid={!!errors?.title}
          />
        </Field>

        <Field className="sm:col-span-2">
          <Label>Uitgevende instantie</Label>
          <Input
            name="issuingAuthority"
            placeholder="bv. CBR"
            defaultValue={defaultValues?.issuingAuthority ?? undefined}
            invalid={!!errors?.issuingAuthority}
          />
        </Field>

        <Field className="sm:col-span-2 relative">
          <Label>Identificatie / Diplomanummer</Label>
          <Input
            name="identifier"
            placeholder="bv. N3E345F"
            defaultValue={defaultValues?.identifier ?? undefined}
            invalid={!!errors?.identifier}
          />
        </Field>

        <Field className="sm:col-span-2">
          <Label>Behaald bij</Label>
          <Input
            name="issuingLocation"
            placeholder="bv. CBR Utrecht"
            defaultValue={defaultValues?.issuingLocation ?? undefined}
            invalid={!!errors?.issuingLocation}
          />
        </Field>

        <Field className="sm:col-span-2 relative">
          <Label>Behaald op</Label>
          <SmartDatePicker
            name="awardedAt"
            defaultValue={
              defaultValues?.awardedAt
                ? new Date(defaultValues.awardedAt)
                : undefined
            }
            invalid={!!errors?.awardedAt}
          />
        </Field>

        <Field className="sm:col-span-4">
          <Label>Overige opmerkingen</Label>
          <Textarea
            name="additionalComments"
            defaultValue={defaultValues?.additionalComments ?? undefined}
            invalid={!!errors?.additionalComments}
          />
        </Field>
      </div>
    </Fieldset>
  );
}
