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
}: { selectedCertificateTemplate: CertificateTemplate["id"] | null }) {
  const template = certificateTemplates.find(
    (template) => template.id === selectedCertificateTemplate,
  );

  return (
    <Fieldset>
      <Legend className="mb-3">3. Vul de details over dit diploma in</Legend>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-5 sm:gap-4">
        <Field className="sm:col-span-4">
          <Label>Uitgevende instantie</Label>
          <Input
            name="metadata_issuing_authority"
            required
            defaultValue={template?.issuingAuthority}
          />
        </Field>

        <Field className="sm:col-span-4 relative">
          <Label>Titel</Label>
          <Input
            name="metadata_title"
            required
            defaultValue={template?.title}
          />
        </Field>

        <Field className="sm:col-span-4 relative">
          <Label>Identificatie</Label>
          <Input
            name="metadata_identifier"
            required
            placeholder="bv. diploma nummer"
          />
        </Field>

        <Field className="sm:col-span-3">
          <Label>Behaald bij</Label>
          <Input name="metadata_issuing_location" required />
        </Field>

        <Field className="sm:col-span-2 relative">
          <Label>Behaald op</Label>
          <SmartDatePicker name="awardedAt" required />
        </Field>

        <Field className="sm:col-span-5">
          <Label>Overige opmerkingen</Label>
          <Textarea name="metadata_additional" required />
        </Field>
      </div>
    </Fieldset>
  );
}
