import {
  Field,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import SmartDatetimePicker from "~/app/(dashboard)/_components/natural-language-input";

export function CWOType() {
  return (
    <Fieldset>
      <Legend className="mb-3">3. Vul de details over dit diploma in</Legend>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-5 sm:gap-4">
        <Field className="sm:col-span-3">
          <Label>Discipline</Label>
          {/* TODO: change to combobox with search */}
          <Input name="metadata_discipline" required />
        </Field>
        <Field className="sm:col-span-2 relative">
          <Label>Niveau</Label>
          {/* TODO: change to combobox with search */}
          <Input name="metadata_niveau" required />
        </Field>

        <Field className="sm:col-span-5">
          <Label>Boottype</Label>
          {/* TODO: change to combobox with search */}
          <Input name="metadata_boattype" required />
        </Field>

        <Field className="sm:col-span-3">
          <Label>Locatie</Label>
          <Input name="metadata_location" required />
        </Field>

        <Field className="sm:col-span-2 relative">
          <Label>Behaald op</Label>
          <SmartDatetimePicker name="awardedAt" required />
        </Field>
      </div>
    </Fieldset>
  );
}

export function VaarbewijsType() {
  return <div>vaarbewijs vragen</div>;
}

export function MarifoonType() {
  return <div>marifoon vragen</div>;
}

export function TKNType() {
  return <div>tkn vragen</div>;
}

export function OtherType() {
  return <div>other vragen</div>;
}
