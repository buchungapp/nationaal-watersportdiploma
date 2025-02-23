import {
  Field,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { SmartDatePicker } from "~/app/(dashboard)/_components/natural-language-input";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import {
  type CertificateTemplate,
  certificateTemplates,
} from "./certificate-templates";

export function Metadata({
  selectedCertificateTemplate,
  errors,
}: {
  selectedCertificateTemplate: CertificateTemplate["id"] | null;
  errors?: Record<string, string>;
}) {
  const template = certificateTemplates.find(
    (template) => template.id === selectedCertificateTemplate,
  );

  return (
    <Fieldset>
      <Legend className="mb-3">3. Vul de details over dit diploma in</Legend>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-4 sm:gap-4">
        <Field className="sm:col-span-4 relative">
          <Label>
            Titel <span className="text-branding-orange">*</span>
          </Label>
          <Input
            name="title"
            required
            placeholder="bv. Vaarbewijs I"
            defaultValue={template?.title}
            invalid={!!errors?.title}
          />
        </Field>

        <Field className="sm:col-span-2">
          <Label>Uitgevende instantie</Label>
          <Input
            name="issuingAuthority"
            placeholder="bv. CBR"
            defaultValue={template?.issuingAuthority}
            invalid={!!errors?.issuingAuthority}
          />
        </Field>

        <Field className="sm:col-span-2 relative">
          <Label>Identificatie / Diplomanummer</Label>
          <Input
            name="identifier"
            placeholder="bv. N3E345F"
            invalid={!!errors?.identifier}
          />
        </Field>

        <Field className="sm:col-span-2">
          <Label>Behaald bij</Label>
          <Input
            name="issuingLocation"
            placeholder="bv. CBR Utrecht"
            invalid={!!errors?.issuingLocation}
          />
        </Field>

        <Field className="sm:col-span-2 relative">
          <Label>Behaald op</Label>
          <SmartDatePicker name="awardedAt" invalid={!!errors?.awardedAt} />
        </Field>

        <Field className="sm:col-span-4">
          <Label>Overige opmerkingen</Label>
          <Textarea
            name="additionalComments"
            invalid={!!errors?.additionalComments}
          />
        </Field>
      </div>
    </Fieldset>
  );
}
